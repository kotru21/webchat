import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";
import { assertStrongSecretsOrThrow } from "./middleware/requireStrongSecrets.js";
import { initializeSocket } from "./socket/index.js";
import { ensureUploadDirs } from "./utils/uploads.js";

const enableSqlitePragmas = async () => {
  await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000;");
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
};

const bootstrap = async () => {
  assertStrongSecretsOrThrow();
  await ensureUploadDirs(process.cwd());
  await enableSqlitePragmas();

  const app = createApp();
  const httpServer = createServer(app);

  const io = initializeSocket(httpServer, {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  });

  app.set("io", io);

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  const gracefulShutdown = async () => {
    await prisma.$disconnect();
    io.close();
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
};

bootstrap().catch(async (error) => {
  console.error("Failed to bootstrap server", error);
  await prisma.$disconnect();
  process.exit(1);
});
