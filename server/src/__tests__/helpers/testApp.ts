import { createServer, type Server as HttpServer } from "node:http";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import type { Server as SocketServer } from "socket.io";
import request from "supertest";
import { createApp } from "../../app.js";
import { env } from "../../config/env.js";
import { initializeSocket } from "../../socket/index.js";
import { ensureUploadDirs } from "../../utils/uploads.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

let migrated = false;
let uploadsReady = false;

export const ensureTestDatabase = (): void => {
  if (migrated) return;
  execSync("npx prisma migrate deploy", {
    cwd: serverRoot,
    env: {
      ...process.env,
      DATABASE_URL: env.DATABASE_URL,
      JWT_SECRET: env.JWT_SECRET,
    },
    stdio: "pipe",
  });
  migrated = true;
};

export const ensureTestUploads = async (): Promise<void> => {
  if (uploadsReady) return;
  await ensureUploadDirs(process.cwd());
  uploadsReady = true;
};

export const buildTestApp = (): Express => {
  ensureTestDatabase();
  void ensureTestUploads();
  return createApp();
};

export interface TestUserCreds {
  email: string;
  password: string;
  username: string;
}

export interface AuthSession {
  agent: ReturnType<typeof request.agent>;
  token: string;
  userId: string;
  refreshToken: string | undefined;
  creds: TestUserCreds;
}

export const uniqueCreds = (prefix: string): TestUserCreds => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `${prefix}.${id}@example.com`,
    password: "TestPass1!",
    username: `${prefix}_${id}`.slice(0, 30),
  };
};

export const parseCookieValue = (
  setCookie: string[] | string | undefined,
  name: string
): string | undefined => {
  const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  for (const header of headers) {
    const match = new RegExp(`(?:^|,\\s*)${name}=([^;]+)`).exec(header);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }
  return undefined;
};

export const registerAndLogin = async (
  app: Express,
  creds: TestUserCreds = uniqueCreds("user")
): Promise<AuthSession> => {
  const register = await request(app).post("/api/auth/register").send(creds);
  if (register.status !== 201) {
    throw new Error(`register failed: ${register.status} ${JSON.stringify(register.body)}`);
  }

  const agent = request.agent(app);
  const login = await agent.post("/api/auth/login").send({
    email: creds.email,
    password: creds.password,
  });

  if (login.status !== 200 || typeof login.body.token !== "string") {
    throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }

  return {
    agent,
    token: login.body.token as string,
    userId: login.body.id as string,
    refreshToken: parseCookieValue(login.headers["set-cookie"], "refreshToken"),
    creds,
  };
};

export interface TestHttpServer {
  app: Express;
  httpServer: HttpServer;
  io: SocketServer;
  baseUrl: string;
  close: () => Promise<void>;
}

export const buildTestHttpServer = async (): Promise<TestHttpServer> => {
  ensureTestDatabase();
  await ensureTestUploads();
  const app = createApp();
  const httpServer = createServer(app);
  const io = initializeSocket(httpServer, {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind test HTTP server");
  }

  return {
    app,
    httpServer,
    io,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
    },
  };
};
