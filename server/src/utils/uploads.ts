import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_PATHS } from "../constants/fileConstants.js";

const uploadDirs = [
  "uploads",
  UPLOAD_PATHS.AVATARS,
  UPLOAD_PATHS.BANNERS,
  UPLOAD_PATHS.MEDIA,
];

export const ensureUploadDirs = async (baseDir: string): Promise<void> => {
  for (const relativeDir of uploadDirs) {
    const fullPath = path.join(baseDir, relativeDir);
    await fs.mkdir(fullPath, { recursive: true });
  }
};

export const safeUnlinkFromServerRoot = async (
  baseDir: string,
  relativePath: string | null | undefined
): Promise<void> => {
  if (!relativePath) return;

  const normalized = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!normalized.startsWith("uploads/")) return;

  const uploadsRoot = path.resolve(baseDir, "uploads");
  const fullPath = path.resolve(baseDir, normalized);

  if (!fullPath.startsWith(uploadsRoot + path.sep) && fullPath !== uploadsRoot) {
    return;
  }

  try {
    await fs.unlink(fullPath);
  } catch {
    return;
  }
};
