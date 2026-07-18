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

  it("rejects multipart message text longer than 1000 chars", async () => {
    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${session.token}`)
      .field("receiverId", peerId)
      .field("text", "x".repeat(1001));

    expect(res.status).toBe(400);
  });

  it("stores non-image media with extension from magic bytes, not originalname", async () => {
    // Minimal PCM WAV (file-type → audio/wav, ext wav).
    const wav = Buffer.alloc(44);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(36, 4);
    wav.write("WAVE", 8);
    wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24);
    wav.writeUInt32LE(8000, 28);
    wav.writeUInt16LE(1, 32);
    wav.writeUInt16LE(8, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(0, 40);

    const spoofed = path.join(tempDir, "x.html");
    await fs.writeFile(spoofed, wav);

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${session.token}`)
      .field("receiverId", peerId)
      .field("content", "audio-spoof-ext")
      .attach("media", spoofed, {
        filename: "x.html",
        contentType: "audio/wav",
      });

    expect(res.status).toBe(201);
    expect(res.body.mediaUrl).toMatch(/^\/api\/media\/media\/[a-f0-9]+\.wav$/);
    expect(res.body.mediaUrl).not.toMatch(/\.html$/);

    const served = await request(app)
      .get(res.body.mediaUrl as string)
      .set("Authorization", `Bearer ${session.token}`);

    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/audio\/(wav|x-wav)|octet-stream/);
  });

  it("rejects video upload as profile avatar", async () => {
    const webm = Buffer.from([
      0x1a, 0x45, 0xdf, 0xa3, 0x9f, 0x42, 0x86, 0x81, 0x01, 0x42, 0xf7, 0x81,
      0x01, 0x42, 0xf2, 0x81, 0x04, 0x42, 0xf3, 0x81, 0x08, 0x42, 0x82, 0x84,
      0x77, 0x65, 0x62, 0x6d, 0x42, 0x87, 0x81, 0x02, 0x42, 0x85, 0x81, 0x02,
    ]);
    const spoofed = path.join(tempDir, "banner.webm");
    await fs.writeFile(spoofed, webm);

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .attach("avatar", spoofed, {
        filename: "avatar.webm",
        contentType: "video/webm",
      });

    expect(res.status).toBe(400);
  });

  it("unlinks previous avatar when profile avatar is replaced", async () => {
    const pngPath = path.join(tempDir, "replace-avatar.png");
    await fs.writeFile(
      pngPath,
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      )
    );

    const first = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .attach("avatar", pngPath, {
        filename: "a1.png",
        contentType: "image/png",
      });
    expect(first.status).toBe(200);
    const oldUrl = first.body.avatar as string;
    const oldFile = path.join(
      process.cwd(),
      "uploads",
      "avatars",
      path.basename(oldUrl)
    );
    await expect(fs.access(oldFile)).resolves.toBeUndefined();

    const second = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .attach("avatar", pngPath, {
        filename: "a2.png",
        contentType: "image/png",
      });
    expect(second.status).toBe(200);
    expect(second.body.avatar).not.toBe(oldUrl);
    await expect(fs.access(oldFile)).rejects.toThrow();
  });

  it("drops pipeline files when banner magic-check fails after avatar", async () => {
    const PNG_1X1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const avatarPng = path.join(tempDir, "ok-avatar.png");
    const badBanner = path.join(tempDir, "bad-banner.png");
    await fs.writeFile(avatarPng, PNG_1X1);
    await fs.writeFile(badBanner, "not-an-image");

    const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
    const bannersDir = path.join(process.cwd(), "uploads", "covers");
    const beforeAvatars = new Set(await fs.readdir(avatarsDir));
    const beforeBanners = new Set(await fs.readdir(bannersDir));

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .attach("avatar", avatarPng, {
        filename: "ok.png",
        contentType: "image/png",
      })
      .attach("banner", badBanner, {
        filename: "bad.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);

    const addedAvatars = (await fs.readdir(avatarsDir)).filter(
      (f) => !beforeAvatars.has(f)
    );
    const addedBanners = (await fs.readdir(bannersDir)).filter(
      (f) => !beforeBanners.has(f)
    );
    expect(addedAvatars).toEqual([]);
    expect(addedBanners).toEqual([]);
  });

  it("drops new avatar when updateUserProfile rejects username", async () => {
    const PNG_1X1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const avatarPng = path.join(tempDir, "orphan-avatar.png");
    await fs.writeFile(avatarPng, PNG_1X1);

    const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
    const beforeAvatars = new Set(await fs.readdir(avatarsDir));

    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .field("username", "x")
      .attach("avatar", avatarPng, {
        filename: "orphan.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);

    const addedAvatars = (await fs.readdir(avatarsDir)).filter(
      (f) => !beforeAvatars.has(f)
    );
    expect(addedAvatars).toEqual([]);
  });

  it("drops avatar when register body validation fails after upload", async () => {
    const PNG_1X1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const avatarPng = path.join(tempDir, "reg-orphan.png");
    await fs.writeFile(avatarPng, PNG_1X1);

    const avatarsDir = path.join(process.cwd(), "uploads", "avatars");
    const beforeAvatars = new Set(await fs.readdir(avatarsDir));

    const res = await request(app)
      .post("/api/auth/register")
      .field("email", "not-an-email")
      .field("password", "weak")
      .attach("avatar", avatarPng, {
        filename: "reg.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);

    // finish handler is async — allow unlink to complete
    await new Promise((r) => setTimeout(r, 50));

    const addedAvatars = (await fs.readdir(avatarsDir)).filter(
      (f) => !beforeAvatars.has(f)
    );
    expect(addedAvatars).toEqual([]);
  });

  it("drops media temp file when multipart text exceeds max length", async () => {
    const PNG_1X1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    const mediaPng = path.join(tempDir, "too-long-text.png");
    await fs.writeFile(mediaPng, PNG_1X1);

    const mediaDir = path.join(process.cwd(), "uploads", "media");
    const beforeMedia = new Set(await fs.readdir(mediaDir));

    const res = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${session.token}`)
      .field("receiverId", peerId)
      .field("text", "x".repeat(1001))
      .attach("media", mediaPng, {
        filename: "unused.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);

    await new Promise((r) => setTimeout(r, 50));

    const addedMedia = (await fs.readdir(mediaDir)).filter(
      (f) => !beforeMedia.has(f)
    );
    expect(addedMedia).toEqual([]);
  });
  it("rejects profile username that breaks charset rules", async () => {
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${session.token}`)
      .field("username", "bad name!");

    expect(res.status).toBe(400);
  });
});
