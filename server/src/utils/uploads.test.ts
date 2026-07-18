import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mediaApiUrlToUploadRelative,
  resolveUnderUploadsRoot,
  safeUnlinkFromServerRoot,
} from "./uploads.js";

describe("resolveUnderUploadsRoot", () => {
  const base = path.resolve("/srv/app");

  it("accepts paths inside uploads/", () => {
    expect(
      resolveUnderUploadsRoot(base, path.join(base, "uploads", "media", "a.bin"))
    ).toBe(path.join(base, "uploads", "media", "a.bin"));
  });

  it("rejects traversal and outside paths", () => {
    expect(
      resolveUnderUploadsRoot(base, path.join(base, "uploads", "..", "secret"))
    ).toBeNull();
    expect(resolveUnderUploadsRoot(base, path.join(base, "other"))).toBeNull();
    expect(resolveUnderUploadsRoot(base, "/etc/passwd")).toBeNull();
  });
});

describe("mediaApiUrlToUploadRelative", () => {
  it("maps api media URLs under uploads/", () => {
    expect(mediaApiUrlToUploadRelative("/api/media/avatars/abc.webp")).toBe(
      "uploads/avatars/abc.webp"
    );
    expect(mediaApiUrlToUploadRelative("/api/media/covers/x.webp")).toBe(
      "uploads/covers/x.webp"
    );
    expect(mediaApiUrlToUploadRelative("/api/media/banners/x.webp")).toBe(
      "uploads/covers/x.webp"
    );
  });

  it("rejects traversal and foreign URLs", () => {
    expect(mediaApiUrlToUploadRelative("/api/media/../secret")).toBeNull();
    expect(mediaApiUrlToUploadRelative("https://evil/x")).toBeNull();
    expect(mediaApiUrlToUploadRelative("")).toBeNull();
  });
});

describe("safeUnlinkFromServerRoot", () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "wc-uploads-"));
    await fs.mkdir(path.join(root, "uploads", "media"), { recursive: true });
    await fs.writeFile(path.join(root, "uploads", "media", "ok.txt"), "x");
    await fs.writeFile(path.join(root, "secret.txt"), "secret");
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("deletes file under uploads/", async () => {
    await safeUnlinkFromServerRoot(root, "/uploads/media/ok.txt");
    await expect(
      fs.access(path.join(root, "uploads", "media", "ok.txt"))
    ).rejects.toThrow();
  });

  it("refuses path traversal outside uploads/", async () => {
    await safeUnlinkFromServerRoot(root, "/uploads/../secret.txt");
    await expect(fs.access(path.join(root, "secret.txt"))).resolves.toBeUndefined();
  });
});
