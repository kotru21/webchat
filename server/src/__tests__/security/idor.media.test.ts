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

/** Minimal valid 1×1 PNG (magic bytes pass file-type + sharp). */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

describe("IDOR / media attachments", () => {
  const app = buildTestApp();
  let userA: AuthSession;
  let userB: AuthSession;
  let userC: AuthSession;
  let mediaUrl: string;
  let tempDir: string;
  let pngPath: string;

  beforeAll(async () => {
    await ensureTestUploads();
    userA = await registerAndLogin(app, uniqueCreds("medialice"));
    userB = await registerAndLogin(app, uniqueCreds("medibob"));
    userC = await registerAndLogin(app, uniqueCreds("medicarel"));

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wc-media-idor-"));
    pngPath = path.join(tempDir, "pixel.png");
    await fs.writeFile(pngPath, PNG_1X1);

    const created = await request(app)
      .post("/api/messages")
      .set("Authorization", `Bearer ${userA.token}`)
      .field("receiverId", userB.userId)
      .field("content", "secret-attachment")
      .attach("media", pngPath, {
        filename: "pixel.png",
        contentType: "image/png",
      });

    expect(created.status).toBe(201);
    expect(typeof created.body.mediaUrl).toBe("string");
    mediaUrl = created.body.mediaUrl as string;
    expect(mediaUrl).toMatch(/^\/api\/media\/media\//);
  });

  afterAll(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("forbids outsider C from GET of A↔B attachment", async () => {
    const res = await request(app)
      .get(mediaUrl)
      .set("Authorization", `Bearer ${userC.token}`);

    expect(res.status).toBe(403);
  });

  it("allows participant A to GET A↔B attachment", async () => {
    const res = await request(app)
      .get(mediaUrl)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/image\/webp|octet-stream/);
  });

  it("allows participant B to GET A↔B attachment", async () => {
    const res = await request(app)
      .get(mediaUrl)
      .set("Authorization", `Bearer ${userB.token}`);

    expect(res.status).toBe(200);
  });
});
