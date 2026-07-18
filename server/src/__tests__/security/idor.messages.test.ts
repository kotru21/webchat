import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

describe("IDOR / message access", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;
  let userC: AuthSession;
  let abMessageId: string;

  beforeAll(async () => {
    userA = await registerAndLogin(app, uniqueCreds("alice"));
    userB = await registerAndLogin(app, uniqueCreds("bob"));
    userC = await registerAndLogin(app, uniqueCreds("carol"));

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: "secret-a-to-b",
      });

    expect(created.status).toBe(201);
    abMessageId = created.body._id as string;
  });

  it("forbids unauthenticated message list", async () => {
    const res = await request(app).get(
      `/api/messages?receiverId=${userB.userId}`
    );
    expect(res.status).toBe(401);
  });

  it("does not leak A↔B messages to user C", async () => {
    const res = await request(app)
      .get(`/api/messages?receiverId=${userB.userId}`)
      .set("Authorization", `Bearer ${userC.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const leaked = res.body.some(
      (message: { _id?: string; content?: string }) =>
        message._id === abMessageId || message.content === "secret-a-to-b"
    );
    expect(leaked).toBe(false);
  });

  it("allows participant A to list A↔B messages", async () => {
    const res = await request(app)
      .get(`/api/messages?receiverId=${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(
      res.body.some(
        (message: { _id?: string }) => message._id === abMessageId
      )
    ).toBe(true);
  });

  it("rejects listing without receiverId", async () => {
    const res = await request(app)
      .get("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(res.status).toBe(400);
  });

  it("forbids forging mediaUrl in POST body without file", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: "hi-no-media",
        mediaUrl: "https://evil.example/x.png",
      });

    expect(res.status).toBe(201);
    expect(res.body.mediaUrl).not.toBe("https://evil.example/x.png");
    expect(res.body.mediaUrl).toBeNull();
  });
});
