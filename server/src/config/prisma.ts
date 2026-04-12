import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

declare global {
  var __prismaClient: PrismaClient | undefined;
}

const prismaClient =
  globalThis.__prismaClient ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: env.DATABASE_URL }),
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prismaClient;
}

export default prismaClient;
