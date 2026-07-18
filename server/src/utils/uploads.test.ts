import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { safeUnlinkFromServerRoot } from "./uploads.js";

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
