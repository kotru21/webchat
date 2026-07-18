import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildTestApp,
  ensureTestUploads,
  registerAndLogin,
  uniqueCreds,
  type AuthSession,
} from "../helpers/testApp.js";

describe("upload / media surface", () => {
  const app = buildTestApp();
  let session: AuthSession;
  let tempDir: string;
  let peerId: string;

  beforeAll(async () => {
    await ensureTestUploads();
    session = await registerAndLogin(app, uniqueCreds("upload"));
    const peer = await registerAndLogin(app, uniqueCreds("uppeer"));
    peerId = peer.userId;
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wc-upload-"));
  });

  afterAll(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("rejects unauthenticated media GET", async () => {
    const res = await request(app).get("/api/media/media/does-not-exist.webp");
    expect(res.status).toBe(401);
  });

  it("does not serve uploads via public static", async () => {
    const res = await request(app).get("/uploads/media/x.webp");
    expect(res.status).toBe(404);
  });

  it("rejects path traversal in authenticated media GET", async () => {
    const encoded = await request(app)
      .get("/api/media/%2e%2e/%2e%2e/package.json")
      .set("Authorization", `Bearer ${session.token}`);

    // Express may normalize ".." before the route (404) or our guard returns 400/403.
    expect([400, 403, 404]).toContain(encoded.status);
    expect(String(encoded.text)).not.toMatch(/"name"\s*:\s*"server"/);

    const nested = await request(app)
      .get("/api/media/media/%2e%2e/%2e%2e/%2e%2e/package.json")
      .set("Authorization", `Bearer ${session.token}`);

    expect([400, 403, 404]).toContain(nested.status);
    expect(String(nested.text)).not.toMatch(/"name"\s*:\s*"server"/);
  });

  it("rejects file with wrong magic bytes", async () => {
    const fakePng = path.join(tempDir, "fake.png");
    await fs.writeFile(fakePng, "not-an-image-payload");

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${session.token}`)
      .field("receiverId", peerId)
      .field("content", "with-bad-file")
      .attach("media", fakePng, {
        filename: "fake.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
  });

  it("stores re-encoded avatars under uploads/avatars and serves them", async () => {
    const PNG_1X1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const avatarPng = path.join(tempDir, "avatar.png");
    await fs.writeFile(avatarPng, PNG_1X1);

    const updated = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .attach("avatar", avatarPng, {
        filename: "avatar.png",
        contentType: "image/png",
      });

    expect(updated.status).toBe(200);
    expect(updated.body.avatar).toMatch(/^\/api\/media\/avatars\/[a-f0-9]+\.webp$/);

    const filename = path.basename(updated.body.avatar as string);
    const onDisk = path.join(process.cwd(), "uploads", "avatars", filename);
    await expect(fs.access(onDisk)).resolves.toBeUndefined();

    const wrongDir = path.join(process.cwd(), "uploads", "media", filename);
    await expect(fs.access(wrongDir)).rejects.toThrow();

    const served = await request(app)
      .get(updated.body.avatar as string)
      .set("Authorization", `Bearer ${session.token}`);

    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/image\/webp/);
  });
});
