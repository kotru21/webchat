import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { io as ioClient, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";
import { dmRoomId } from "../../services/accessControl.js";
import {
  buildTestHttpServer,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
  type TestHttpServer,
} from "../helpers/testApp.js";

const connectSocket = (baseUrl: string, token: string): Promise<Socket> => {
  const socket = ioClient(baseUrl, {
    auth: { token },
    transports: ["websocket"],
    forceNew: true,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("socket connect timeout")), 10_000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
};

const emitAck = <T>(
  socket: Socket,
  event: string,
  payload: unknown
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout: ${event}`)), 10_000);
    socket.emit(event, payload, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
};

describe("socket ACL", () => {
  let server: TestHttpServer;
  let userA: AuthSession;
  let userB: AuthSession;
  let userC: AuthSession;
  let socketA: Socket;

  beforeAll(async () => {
    server = await buildTestHttpServer();
    userA = await registerAndLogin(server.app, uniqueCreds("socka"));
    userB = await registerAndLogin(server.app, uniqueCreds("sockb"));
    userC = await registerAndLogin(server.app, uniqueCreds("sockc"));
    socketA = await connectSocket(server.baseUrl, userA.token);
  });

  afterAll(async () => {
    socketA?.disconnect();
    await server?.close();
  });

  it("rejects auth via query string token", async () => {
    const socket = ioClient(server.baseUrl, {
      query: { token: userA.token },
      transports: ["websocket"],
      forceNew: true,
    });

    await expect(
      new Promise<never>((_resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("expected connect_error")),
          10_000
        );
        socket.on("connect", () => {
          clearTimeout(timer);
          reject(new Error("query token must not authenticate"));
        });
        socket.on("connect_error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      })
    ).rejects.toMatchObject({ message: "AUTH_REQUIRED" });

    socket.disconnect();
  });

  it("rejects join_room for foreign dm room", async () => {
    const foreign = dmRoomId(userB.userId, userC.userId);
    const result = await emitAck<{ error?: string; ok?: boolean }>(
      socketA,
      SOCKET_EVENTS.JOIN_ROOM,
      foreign
    );
    expect(result.error).toBe("FORBIDDEN");
    expect(result.ok).toBeUndefined();
  });

  it("allows join_room for own dm room", async () => {
    const own = dmRoomId(userA.userId, userB.userId);
    const result = await emitAck<{ error?: string; ok?: boolean }>(
      socketA,
      SOCKET_EVENTS.JOIN_ROOM,
      own
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects join_room for non-canonical own dm room order", async () => {
    const [minId, maxId] = [userA.userId, userB.userId].sort();
    const nonCanonical = `dm:${maxId}:${minId}`;
    expect(nonCanonical).not.toBe(dmRoomId(userA.userId, userB.userId));

    const result = await emitAck<{ error?: string; ok?: boolean }>(
      socketA,
      SOCKET_EVENTS.JOIN_ROOM,
      nonCanonical
    );
    expect(result.error).toBe("FORBIDDEN");
    expect(result.ok).toBeUndefined();
  });

  it("rejects join_room for general and foreign user rooms", async () => {
    const general = await emitAck<{ error?: string }>(
      socketA,
      SOCKET_EVENTS.JOIN_ROOM,
      "general"
    );
    expect(general.error).toBe("FORBIDDEN");

    const foreignUser = await emitAck<{ error?: string }>(
      socketA,
      SOCKET_EVENTS.JOIN_ROOM,
      `user:${userB.userId}`
    );
    expect(foreignUser.error).toBe("FORBIDDEN");
  });

  it("ignores client mediaUrl on message_send", async () => {
    const result = await emitAck<{ ok?: boolean; id?: string; error?: string }>(
      socketA,
      SOCKET_EVENTS.MESSAGE_SEND,
      {
        receiverId: userB.userId,
        content: "socket-text-only",
        mediaUrl: "https://evil.example/leak.png",
        mediaType: "image",
      }
    );

    expect(result.ok).toBe(true);
    expect(result.id).toBeTruthy();

    const list = await fetch(
      `${server.baseUrl}/api/messages?receiverId=${userB.userId}`,
      { headers: { Authorization: `Bearer ${userA.token}` } }
    );
    const messages = (await list.json()) as Array<{
      _id: string;
      mediaUrl: string | null;
      content: string;
      senderUsername?: string;
    }>;

    const saved = messages.find((message) => message._id === result.id);
    expect(saved?.content).toBe("socket-text-only");
    expect(saved?.mediaUrl).toBeNull();
    expect(saved?.senderUsername).toBeTruthy();
    expect(String(saved?.senderUsername)).not.toContain("@");
  });

  it("rejects oversized message_send content", async () => {
    const result = await emitAck<{ ok?: boolean; error?: string }>(
      socketA,
      SOCKET_EVENTS.MESSAGE_SEND,
      {
        receiverId: userB.userId,
        content: "x".repeat(1001),
      }
    );

    expect(result.error).toBe("TOO_LONG");
    expect(result.ok).toBeUndefined();
  });

  it("delivers MESSAGE_NEW to receiver user room without dm join", async () => {
    const socketB = await connectSocket(server.baseUrl, userB.token);
    socketB.emit(SOCKET_EVENTS.USER_CONNECTED);

    const received = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("no MESSAGE_NEW")), 10_000);
      socketB.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });

    // Give join time to process
    await new Promise((r) => setTimeout(r, 50));

    const result = await emitAck<{ ok?: boolean; id?: string }>(
      socketA,
      SOCKET_EVENTS.MESSAGE_SEND,
      {
        receiverId: userB.userId,
        content: "via-user-room",
      }
    );
    expect(result.ok).toBe(true);

    const msg = (await received) as { content?: string };
    expect(msg.content).toBe("via-user-room");
    socketB.disconnect();
  });

  it("disconnects user sockets on logout", async () => {
    const sock = await connectSocket(server.baseUrl, userC.token);
    sock.emit(SOCKET_EVENTS.USER_CONNECTED);
    await new Promise((r) => setTimeout(r, 50));

    const disconnected = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("socket stayed up")), 10_000);
      sock.on("disconnect", () => {
        clearTimeout(timer);
        resolve();
      });
    });

    const logoutRes = await fetch(`${server.baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userC.token}`,
        Cookie: `refreshToken=${userC.refreshToken}`,
      },
    });
    expect(logoutRes.status).toBe(200);

    await disconnected;
    expect(sock.connected).toBe(false);
  });
});
