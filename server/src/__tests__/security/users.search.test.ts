import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

describe("GET /api/auth/users search", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;

  beforeAll(async () => {
    userA = await registerAndLogin(app, uniqueCreds("searcha"));
    userB = await registerAndLogin(app, uniqueCreds("searchb"));
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/auth/users?q=search");
    expect(res.status).toBe(401);
  });

  it("finds other users by username and excludes self", async () => {
    const res = await request(app)
      .get(`/api/auth/users?q=${encodeURIComponent(userB.creds.username)}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const ids = res.body.map((u: { _id?: string }) => u._id);
    expect(ids).toContain(userB.userId);
    expect(ids).not.toContain(userA.userId);
  });

  it("does not expose email in public search DTOs", async () => {
    const res = await request(app)
      .get(`/api/auth/users?q=${encodeURIComponent(userB.creds.username)}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    const hit = res.body.find((u: { _id?: string }) => u._id === userB.userId);
    expect(hit).toBeTruthy();
    expect(hit).not.toHaveProperty("email");
    expect(hit.username).toBe(userB.creds.username);
  });

  it("returns empty list for blank query", async () => {
    const res = await request(app)
      .get("/api/auth/users?q=")
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("matches usernames case-insensitively", async () => {
    const mixedCaseQuery = userB.creds.username
      .split("")
      .map((ch, i) => (i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase()))
      .join("");

    expect(mixedCaseQuery).not.toBe(userB.creds.username);

    const res = await request(app)
      .get(`/api/auth/users?q=${encodeURIComponent(mixedCaseQuery)}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    const ids = res.body.map((u: { _id?: string }) => u._id);
    expect(ids).toContain(userB.userId);
  });
});
