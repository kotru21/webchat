import request from "supertest";
import { describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import { buildTestApp } from "../helpers/testApp.js";

describe("origin allowlist on cookie-authenticated endpoints", () => {
  const app = buildTestApp();

  it("rejects cross-site refresh", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Origin", "https://evil.example")
      .set("Cookie", "refreshToken=whatever");

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ORIGIN_FORBIDDEN");
  });

  it("rejects cross-site logout", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Origin", "https://evil.example");

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("ORIGIN_FORBIDDEN");
  });

  it("allows the configured client origin", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Origin", env.CLIENT_URL);

    expect(res.status).toBe(200);
  });

  it("allows origin-less (non-browser) requests", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });
});
