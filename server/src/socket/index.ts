import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import prisma from "../config/prisma.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import {
  assertCanListDm,
  dmRoomId,
} from "../services/accessControl.js";
import { createMessage } from "../services/messageService.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { allowSocketEvent } from "./rateLimit.js";
import { isAllowedSocketRoom, peerIdFromDmRoom, userRoomId } from "./rooms.js";

interface CorsOptions {
  origin: string;
  methods: string[];
  credentials: boolean;
}

let ioInstance: Server | undefined;

const extractBearerToken = (authorizationHeader: string | undefined): string | undefined => {
  if (!authorizationHeader) return undefined;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return undefined;
  return token;
};

const assertDmPeerExists = async (
  selfId: string,
  roomId: string
): Promise<boolean> => {
  const peerId = peerIdFromDmRoom(selfId, roomId);
  if (!peerId) return true; // user:<self> — no peer
  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: { id: true },
  });
  return peer != null;
};

export const initializeSocket = (httpServer: HttpServer, corsOptions: CorsOptions) => {
  ioInstance = new Server(httpServer, { cors: corsOptions });

  ioInstance.use(async (socket, next) => {
    try {
      // Prefer handshake.auth / Authorization — never query (log/referrer leak).
      const tokenFromAuth =
        typeof socket.handshake.auth?.token === "string"
          ? socket.handshake.auth.token
          : undefined;

      const tokenFromHeader = extractBearerToken(
        socket.handshake.headers.authorization
      );

      const token = tokenFromAuth ?? tokenFromHeader;

      if (!token) {
        next(new Error("AUTH_REQUIRED"));
        return;
      }

      const payload = verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
        },
      });

      if (!user) {
        next(new Error("USER_NOT_FOUND"));
        return;
      }

      const socketUser: AuthenticatedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      };

      socket.data.user = socketUser;
      next();
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        next(new Error("TOKEN_EXPIRED"));
        return;
      }

      next(new Error("INVALID_TOKEN"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const authUser = socket.data.user as AuthenticatedUser | undefined;
    if (authUser) {
      // Join immediately — do not rely on client USER_CONNECTED for logout kicks.
      void socket.join(userRoomId(authUser.id));
    }

    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId: unknown, cb?) => {
      void (async () => {
        const authUser = socket.data.user as AuthenticatedUser | undefined;
        if (!authUser || typeof roomId !== "string") {
          cb?.({ error: "FORBIDDEN" });
          return;
        }
        if (!allowSocketEvent(`join:${authUser.id}`, 20, 60_000)) {
          cb?.({ error: "RATE_LIMIT" });
          return;
        }
        if (!isAllowedSocketRoom(authUser.id, roomId)) {
          cb?.({ error: "FORBIDDEN" });
          return;
        }
        if (!(await assertDmPeerExists(authUser.id, roomId))) {
          cb?.({ error: "FORBIDDEN" });
          return;
        }
        socket.join(roomId);
        cb?.({ ok: true });
      })();
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, cb) => {
      try {
        const authUser = socket.data.user as AuthenticatedUser | undefined;
        if (!authUser) {
          cb?.({ error: "NO_USER" });
          return;
        }
        if (!allowSocketEvent(authUser.id)) {
          cb?.({ error: "RATE_LIMIT" });
          return;
        }

        const receiverId =
          payload && typeof payload.receiverId === "string"
            ? payload.receiverId
            : undefined;
        const content =
          payload && typeof payload.content === "string" ? payload.content : "";

        // BAN: client mediaUrl / mediaType are ignored
        if (!receiverId || !content.trim()) {
          cb?.({ error: "EMPTY" });
          return;
        }

        // Match REST validateMessage max length.
        if (content.length > 1000) {
          cb?.({ error: "TOO_LONG" });
          return;
        }

        assertCanListDm(authUser.id, receiverId);

        const room = dmRoomId(authUser.id, receiverId);
        const savedMessage = await createMessage({
          senderId: authUser.id,
          senderUsername: authUser.username?.trim() || "user",
          receiverId,
          content,
          mediaUrl: null,
          mediaType: null,
          audioDuration: null,
          isPrivate: true,
          roomId: room,
        });

        // DM room for open chat + user room so receiver gets it in any UI state.
        ioInstance
          ?.to([room, userRoomId(receiverId)])
          .emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
        cb?.({ ok: true, id: savedMessage._id });
      } catch {
        cb?.({ error: "SERVER" });
      }
    });

    socket.on("disconnect", () => {});
  });

  return ioInstance;
};

export const getSocketServer = () => ioInstance;
