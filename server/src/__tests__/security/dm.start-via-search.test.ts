import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  buildTestApp,
  registerAndLogin,
  uniqueCreds,
} from "../helpers/testApp.js";

describe("search → first DM → chats list", () => {
  const app = buildTestApp();

  it("lets a new user find a peer and start a DM", async () => {
    const userA = await registerAndLogin(app, uniqueCreds("dma"));
    const userB = await registerAndLogin(app, uniqueCreds("dmb"));

    const empty = await request(app)
      .get("/api/chats")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual([]);

    const search = await request(app)
      .get(`/api/auth/users?q=${encodeURIComponent(userB.creds.username)}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(search.status).toBe(200);
    expect(search.body.some((u: { _id: string }) => u._id === userB.userId)).toBe(
      true
    );
    expect(search.body[0]).not.toHaveProperty("email");

    const sent = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiverId: userB.userId, content: "first hello" });
    expect(sent.status).toBe(201);

    const chats = await request(app)
      .get("/api/chats")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(chats.status).toBe(200);
    expect(chats.body).toHaveLength(1);
    expect(chats.body[0].user._id).toBe(userB.userId);
    expect(chats.body[0].lastMessage.content).toBe("first hello");
    expect(chats.body[0].user).not.toHaveProperty("email");
  });
});
