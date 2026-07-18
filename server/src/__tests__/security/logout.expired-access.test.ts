import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import {
  buildTestApp,
  parseCookieValue,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

const isCleared = (header: string) =>
  /Max-Age=0/i.test(header) || /Expires=/i.test(header);

describe("logout with expired access JWT", () => {
  const app = buildTestApp();
  let session: AuthSession;

  beforeAll(async () => {
    session = await registerAndLogin(app, uniqueCreds("logout"));
  });

  it("clears refresh cookie and revokes sessions when access JWT is expired", async () => {
    expect(session.refreshToken).toBeTruthy();
    const refreshToken = session.refreshToken as string;

    const expiredAccess = jwt.sign(
      { id: session.userId },
      env.JWT_SECRET,
      { expiresIn: -1 }
    );

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${expiredAccess}`)
      .set("Cookie", `refreshToken=${refreshToken}; hasRefreshSession=1`);

    expect(logoutRes.status).toBe(200);

    const setCookie = logoutRes.headers["set-cookie"];
    const headers = Array.isArray(setCookie)
      ? setCookie
      : setCookie
        ? [setCookie]
        : [];

    expect(headers.some((h) => /refreshToken=/.test(h) && isCleared(h))).toBe(
      true
    );
    expect(
      headers.some((h) => /hasRefreshSession=/.test(h) && isCleared(h))
    ).toBe(true);

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${refreshToken}`);

    expect(refreshRes.status).toBe(401);
  });
});
