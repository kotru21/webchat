import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  parseCookieValue,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

describe("refresh token reuse detection", () => {
  const app = buildTestApp();
  let session: AuthSession;

  beforeAll(async () => {
    session = await registerAndLogin(app, uniqueCreds("refresh"));
  });

  it("revokes family on refresh token reuse", async () => {
    expect(session.refreshToken).toBeTruthy();
    const oldRefresh = session.refreshToken as string;

    const rotated = await session.agent.post("/api/auth/refresh");
    expect(rotated.status).toBe(200);
    expect(typeof rotated.body.token).toBe("string");

    const secondRefresh = parseCookieValue(
      rotated.headers["set-cookie"],
      "refreshToken"
    );
    expect(secondRefresh).toBeTruthy();
    expect(secondRefresh).not.toBe(oldRefresh);

    const reuse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${oldRefresh}`);

    expect(reuse.status).toBe(401);
    expect(reuse.body.code).toBe("REFRESH_REUSE_DETECTED");

    const withRotated = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${secondRefresh}`);

    expect(withRotated.status).toBe(401);
    expect(["REFRESH_REUSE_DETECTED", "INVALID_REFRESH_TOKEN"]).toContain(
      withRotated.body.code
    );
  });

  it("rejects refresh without cookie", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("REFRESH_TOKEN_REQUIRED");
  });

  it("clears refresh cookies when refresh token is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", "refreshToken=not-a-real-token; hasRefreshSession=1");

    expect(res.status).toBe(401);

    const setCookie = res.headers["set-cookie"];
    const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
    const isCleared = (header: string) =>
      /Max-Age=0/i.test(header) || /Expires=/i.test(header);

    expect(headers.some((h) => /refreshToken=/.test(h) && isCleared(h))).toBe(
      true
    );
    expect(
      headers.some((h) => /hasRefreshSession=/.test(h) && isCleared(h))
    ).toBe(true);
  });
});
