import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

const E2EE_ALG = "ECDH-P256+HKDF-SHA256+A256GCM";

const b64 = (bytes: number): string =>
  Buffer.alloc(bytes, 0xab).toString("base64");

const validEnvelope = (): string =>
  JSON.stringify({
    v: 1,
    alg: E2EE_ALG,
    salt: b64(32),
    iv: b64(12),
    ct: b64(48),
  });

describe("E2EE messages contentFormat", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;

  beforeAll(async () => {
    userA = await registerAndLogin(app, uniqueCreds("e2mA"));
    userB = await registerAndLogin(app, uniqueCreds("e2mB"));
  });

  it("e2ee-v1 round-trip stores envelope verbatim + contentFormat", async () => {
    const envelope = validEnvelope();
    const send = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: envelope,
        contentFormat: "e2ee-v1",
      });
    expect(send.status).toBe(201);
    expect(send.body.contentFormat).toBe("e2ee-v1");
    expect(send.body.content).toBe(envelope);

    const list = await request(app)
      .get("/api/messages")
      .query({ receiverId: userB.userId })
      .set("Authorization", `Bearer ${userA.token}`);
    expect(list.status).toBe(200);
    const found = list.body.find((m: { _id: string }) => m._id === send.body._id);
    expect(found).toBeTruthy();
    expect(found.content).toBe(envelope);
    expect(found.contentFormat).toBe("e2ee-v1");
  });

  it("e2ee-v1 with 9 KB content → 400", async () => {
    const huge = JSON.stringify({
      v: 1,
      alg: E2EE_ALG,
      salt: b64(32),
      iv: b64(12),
      ct: "A".repeat(9000),
    });
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: huge,
        contentFormat: "e2ee-v1",
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ENVELOPE");
  });

  it("malformed envelope JSON → 400 INVALID_ENVELOPE", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: "{not-json",
        contentFormat: "e2ee-v1",
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_ENVELOPE");
  });

  it("e2ee-v1 + file upload → 400 E2EE_MEDIA_UNSUPPORTED", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .field("receiverId", userB.userId)
      .field("content", validEnvelope())
      .field("contentFormat", "e2ee-v1")
      .attach("media", png, { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("E2EE_MEDIA_UNSUPPORTED");
  });

  it("blocked pair sending e2ee-v1 → 403 DM_BLOCKED", async () => {
    const block = await request(app)
      .post(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
    expect(block.status).toBe(204);

    const send = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: userB.userId,
        content: validEnvelope(),
        contentFormat: "e2ee-v1",
      });
    expect(send.status).toBe(403);
    expect(send.body.code).toBe("DM_BLOCKED");

    await request(app)
      .delete(`/api/blocks/${userB.userId}`)
      .set("Authorization", `Bearer ${userA.token}`);
  });

  it("plain messages unaffected", async () => {
    const send = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ receiverId: userB.userId, content: "hello-plain" });
    expect(send.status).toBe(201);
    expect(send.body.contentFormat).toBe("plain");
    expect(send.body.content).toBe("hello-plain");
  });

  it("chats list lastMessage includes contentFormat for e2ee-v1", async () => {
    const peer = await registerAndLogin(app, uniqueCreds("e2chat"));
    const envelope = validEnvelope();
    const send = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({
        receiverId: peer.userId,
        content: envelope,
        contentFormat: "e2ee-v1",
      });
    expect(send.status).toBe(201);

    const chats = await request(app)
      .get("/api/chats")
      .set("Authorization", `Bearer ${userA.token}`);
    expect(chats.status).toBe(200);
    const row = chats.body.find(
      (c: { user: { _id: string } }) => c.user._id === peer.userId
    );
    expect(row).toBeTruthy();
    expect(row.lastMessage.contentFormat).toBe("e2ee-v1");
    expect(row.lastMessage.content).toBe(envelope);
  });
});
