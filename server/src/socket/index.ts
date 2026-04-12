import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import prisma from "../config/prisma.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import { createMessage } from "../services/messageService.js";
import type { AuthenticatedUser } from "../types/auth.js";
import { verifyAccessToken } from "../utils/tokens.js";

type CorsOptions = {
  origin: string;
  methods: string[];
  credentials: boolean;
};

let ioInstance: Server | undefined;

const extractBearerToken = (authorizationHeader: string | undefined): string | undefined => {
  if (!authorizationHeader) return undefined;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return undefined;
  return token;
};

export const initializeSocket = (httpServer: HttpServer, corsOptions: CorsOptions) => {
  ioInstance = new Server(httpServer, { cors: corsOptions });

  ioInstance.use(async (socket, next) => {
    try {
      const tokenFromAuth =
        typeof socket.handshake.auth?.token === "string"
          ? socket.handshake.auth.token
          : undefined;

      const tokenFromQuery =
        typeof socket.handshake.query?.token === "string"
          ? socket.handshake.query.token
          : undefined;

      const tokenFromHeader = extractBearerToken(
        socket.handshake.headers.authorization
      );

      const token = tokenFromAuth ?? tokenFromQuery ?? tokenFromHeader;

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
    socket.on(SOCKET_EVENTS.USER_CONNECTED, () => {
      const authUser = socket.data.user as AuthenticatedUser | undefined;
      if (!authUser) return;
      socket.join(authUser.id);
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId: unknown) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.join(roomId);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (payload, cb) => {
      try {
        const authUser = socket.data.user as AuthenticatedUser | undefined;
        if (!authUser) {
          cb?.({ error: "NO_USER" });
          return;
        }

        const receiverId =
          payload && typeof payload.receiverId === "string"
            ? payload.receiverId
            : undefined;

        const content =
          payload && typeof payload.content === "string" ? payload.content : "";

        if (!content.trim() && !payload?.mediaUrl) {
          cb?.({ error: "EMPTY" });
          return;
        }

        const savedMessage = await createMessage({
          senderId: authUser.id,
          senderUsername: authUser.username || authUser.email,
          receiverId: receiverId ?? null,
          content,
          mediaUrl: payload?.mediaUrl ?? null,
          mediaType: payload?.mediaType ?? null,
          audioDuration: payload?.audioDuration ?? null,
          isPrivate: Boolean(receiverId),
        });

        if (savedMessage.isPrivate && savedMessage.receiver) {
          ioInstance?.to(savedMessage.sender._id)
            .to(savedMessage.receiver._id)
            .emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
        } else {
          ioInstance?.to("general").emit(SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
        }

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
