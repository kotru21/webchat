import jwt from "jsonwebtoken";
import { io as ioClient, type Socket } from "socket.io-client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import {
  buildTestApp,
  buildTestHttpServer,
  parseCookieValue,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
  type TestHttpServer,
} from "../helpers/testApp.js";

describe("logout access-token revocation", () => {
  const app = buildTestApp();

  it("login → logout → old Bearer on /me → 401", async () => {
    const session = await registerAndLogin(app, uniqueCreds("rev1"));
    const oldToken = session.token;

    const logoutRes = await session.agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${oldToken}`);
    expect(me.status).toBe(401);
    expect(me.body.message).toBe("Сессия завершена");
  });

  it("two devices: logout A leaves B's Bearer and refresh alive", async () => {
    const creds = uniqueCreds("rev2");
    await request(app).post("/api/auth/register").send(creds);

    const deviceA = request.agent(app);
    const loginA = await deviceA.post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    expect(loginA.status).toBe(200);
    const tokenA = loginA.body.token as string;

    const deviceB = request.agent(app);
    const loginB = await deviceB.post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    expect(loginB.status).toBe(200);
    const tokenB = loginB.body.token as string;

    const logoutA = await deviceA.post("/api/auth/logout");
    expect(logoutA.status).toBe(200);

    const meA = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(meA.status).toBe(401);

    const meB = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(meB.status).toBe(200);

    const refreshB = await deviceB.post("/api/auth/refresh");
    expect(refreshB.status).toBe(200);
    expect(typeof refreshB.body.token).toBe("string");
  });

  it("logout-all from B kills both Bearers and refresh cookies", async () => {
    const creds = uniqueCreds("rev3");
    await request(app).post("/api/auth/register").send(creds);

    const deviceA = request.agent(app);
    const loginA = await deviceA.post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    const tokenA = loginA.body.token as string;
    const refreshA = parseCookieValue(
      loginA.headers["set-cookie"],
      "refreshToken"
    );

    const deviceB = request.agent(app);
    const loginB = await deviceB.post("/api/auth/login").send({
      email: creds.email,
      password: creds.password,
    });
    const tokenB = loginB.body.token as string;

    const logoutAll = await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(logoutAll.status).toBe(200);

    const meA = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(meA.status).toBe(401);

    const meB = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(meB.status).toBe(401);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshA}`);
    expect(refreshRes.status).toBe(401);
  });

  it("token without sid → 401 on REST", async () => {
    const session = await registerAndLogin(app, uniqueCreds("rev4"));
    const noSid = jwt.sign({ id: session.userId }, env.JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    });

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${noSid}`);
    expect(me.status).toBe(401);
  });
});

describe("logout socket TOKEN_REVOKED", () => {
  let server: TestHttpServer;
  let session: AuthSession;

  beforeAll(async () => {
    server = await buildTestHttpServer();
    session = await registerAndLogin(server.app, uniqueCreds("revsock"));
  });

  afterAll(async () => {
    await server.close();
  });

  it("socket handshake with revoked token → TOKEN_REVOKED", async () => {
    await session.agent.post("/api/auth/logout");

    const err = await new Promise<Error>((resolve, reject) => {
      const sock: Socket = ioClient(server.baseUrl, {
        transports: ["websocket"],
        auth: { token: session.token },
        autoConnect: false,
        reconnection: false,
      });
      const timer = setTimeout(() => {
        sock.close();
        reject(new Error("expected connect_error"));
      }, 10_000);
      sock.on("connect_error", (error) => {
        clearTimeout(timer);
        sock.close();
        resolve(error);
      });
      sock.on("connect", () => {
        clearTimeout(timer);
        sock.close();
        reject(new Error("unexpected connect"));
      });
      sock.connect();
    });

    expect(err.message).toBe("TOKEN_REVOKED");
  });
});
