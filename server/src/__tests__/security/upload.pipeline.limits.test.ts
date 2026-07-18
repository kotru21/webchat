import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  IMAGE_LIMIT_INPUT_PIXELS,
  reencodeImageToWebp,
} from "../../services/uploadPipeline.js";

const writeAnimatedGif = async (
  filePath: string,
  pages = 3,
  size = 32
): Promise<void> => {
  const frames: Buffer[] = [];
  for (let i = 0; i < pages; i += 1) {
    frames.push(
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: i * 60, g: 80, b: 200 - i * 40, alpha: 1 },
        },
      })
        .raw()
        .toBuffer()
    );
  }
  await sharp(Buffer.concat(frames), {
    raw: {
      width: size,
      height: size * pages,
      channels: 4,
      pageHeight: size,
    },
  })
    .gif()
    .toFile(filePath);
};

describe("uploadPipeline reencodeImageToWebp", () => {
  let tempDir: string;

  beforeAll(async () => {
    // Pipeline enforces inputs under uploads/ (multer invariant) — keep the
    // fixtures where production files actually live.
    const uploadsMedia = path.join(process.cwd(), "uploads", "media");
    await fs.mkdir(uploadsMedia, { recursive: true });
    tempDir = await fs.mkdtemp(path.join(uploadsMedia, "wc-pipeline-"));
  });

  afterAll(async () => {
    if (!tempDir) return;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  });

  it("re-encodes small images to webp under the pixel budget", async () => {
    const input = path.join(tempDir, "tiny.png");
    await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 0, g: 128, b: 255 },
      },
    })
      .png()
      .toFile(input);

    const result = await reencodeImageToWebp(input, tempDir);
    expect(result.filename).toMatch(/\.webp$/);
    const meta = await sharp(path.join(tempDir, result.filename)).metadata();
    expect(meta.format).toBe("webp");
    expect((meta.width ?? 0) * (meta.height ?? 0)).toBeLessThanOrEqual(
      IMAGE_LIMIT_INPUT_PIXELS
    );
  });

  it("rejects rasters that exceed limitInputPixels (decompression bomb bound)", async () => {
    // 8000² = 64MP > 40MP limit
    const input = path.join(tempDir, "bomb.png");
    await sharp({
      create: {
        width: 8000,
        height: 8000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toFile(input);

    await expect(reencodeImageToWebp(input, tempDir)).rejects.toThrow();
  });

  it("preserves multiple frames when re-encoding animated GIF", async () => {
    const input = path.join(tempDir, "anim.gif");
    await writeAnimatedGif(input, 3, 32);

    const before = await sharp(input, { animated: true }).metadata();
    expect(before.pages).toBe(3);

    const result = await reencodeImageToWebp(input, tempDir);
    const after = await sharp(path.join(tempDir, result.filename), {
      animated: true,
    }).metadata();
    expect(after.format).toBe("webp");
    expect(after.pages).toBe(3);
  });
});
