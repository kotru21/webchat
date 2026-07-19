import { io as ioClient, type Socket } from "socket.io-client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SOCKET_EVENTS } from "../../constants/socketEvents.js";
import {
  buildTestApp,
  buildTestHttpServer,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
  type TestHttpServer,
} from "../helpers/testApp.js";

describe("DM block lists", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;

  beforeAll(async () => {
    userA = await registerAndLogin(app, uniqueCreds("blkA"));
    userB = await registerAndLogin(app, uniqueCreds("blkB"));

    // Seed history before block so listability can be asserted later.
    const seeded = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiverId: userB.userId, content: "pre-block history" });
    expect(seeded.status).toBe(201);
  });

  it("blocks both directions on REST and socket send", async () => {
    const block = await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(block.status).toBe(204);

    const aToB = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiverId: userB.userId, content: "blocked-a" });
    expect(aToB.status).toBe(403);
    expect(aToB.body.code).toBe("DM_BLOCKED");

    const bToA = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ receiverId: userA.userId, content: "blocked-b" });
    expect(bToA.status).toBe(403);
    expect(bToA.body.code).toBe("DM_BLOCKED");
  });

  it("unblock restores send", async () => {
    const unblock = await request(app)
      .delete(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(unblock.status).toBe(204);

    const send = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiverId: userB.userId, content: "after-unblock" });
    expect(send.status).toBe(201);
  });

  it("self-block 400, missing peer 404, double block idempotent", async () => {
    const self = await request(app)
      .post(`/api/blocks/${userA.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(self.status).toBe(400);
    expect(self.body.code).toBe("INVALID_PEER");

    const missing = await request(app)
      .post("/api/blocks/nonexistent-user-id")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(missing.status).toBe(404);
    expect(missing.body.code).toBe("USER_NOT_FOUND");

    const first = await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(first.status).toBe(204);

    const second = await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(second.status).toBe(204);

    await request(app)
      .delete(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
  });

  it("list is scoped to caller and has no email", async () => {
    await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);

    const listA = await request(app)
      .get("/api/blocks")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(listA.status).toBe(200);
    expect(Array.isArray(listA.body)).toBe(true);
    expect(listA.body.some((u: { _id?: string }) => u._id === userB.userId)).toBe(
      true
    );
    for (const user of listA.body) {
      expect(user).not.toHaveProperty("email");
    }

    const listB = await request(app)
      .get("/api/blocks")
      .set("Authorization", `Bearer ${userB.token}`);
    expect(listB.status).toBe(200);
    expect(
      listB.body.some((u: { _id?: string }) => u._id === userA.userId)
    ).toBe(false);

    await request(app)
      .delete(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
  });

  it("history with blocked peer remains listable", async () => {
    await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);

    const history = await request(app)
      .get(`/api/messages?receiverId=${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(history.status).toBe(200);
    expect(
      history.body.some(
        (m: { content?: string }) => m.content === "pre-block history"
      )
    ).toBe(true);

    await request(app)
      .delete(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
  });
});

describe("DM block socket send", () => {
  let server: TestHttpServer;
  let userA: AuthSession;
  let userB: AuthSession;

  beforeAll(async () => {
    server = await buildTestHttpServer();
    userA = await registerAndLogin(server.app, uniqueCreds("blksA"));
    userB = await registerAndLogin(server.app, uniqueCreds("blksB"));
    await request(server.app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
  });

  afterAll(async () => {
    await server.close();
  });

  it("socket send returns BLOCKED when either party blocked", async () => {
    const sock: Socket = ioClient(server.baseUrl, {
      transports: ["websocket"],
      auth: { token: userB.token },
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("connect timeout")), 10_000);
      sock.on("connect", () => {
        clearTimeout(timer);
        resolve();
      });
      sock.on("connect_error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const result = await new Promise<{ error?: string }>((resolve) => {
      sock.emit(
        SOCKET_EVENTS.MESSAGE_SEND,
        { receiverId: userA.userId, content: "socket-blocked" },
        (cb: { error?: string }) => resolve(cb)
      );
    });

    expect(result.error).toBe("BLOCKED");
    sock.disconnect();
  });
});
