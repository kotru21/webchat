import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", env.CLIENT_URL],
          mediaSrc: ["'self'", "data:", "blob:", env.CLIENT_URL],
          connectSrc: ["'self'", env.CLIENT_URL],
        },
      },
    })
  );
  app.use(compression());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/uploads",
    (_req, res, next) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.join(process.cwd(), "uploads"))
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/chats", chatRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
