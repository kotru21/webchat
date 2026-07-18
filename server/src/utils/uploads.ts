import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_PATHS } from "../constants/fileConstants.js";

const uploadDirs = [
  "uploads",
  UPLOAD_PATHS.AVATARS,
  UPLOAD_PATHS.COVERS,
  UPLOAD_PATHS.MEDIA,
];

export const ensureUploadDirs = async (baseDir: string): Promise<void> => {
  for (const relativeDir of uploadDirs) {
    const fullPath = path.join(baseDir, relativeDir);
    await fs.mkdir(fullPath, { recursive: true });
  }
};

/**
 * Map `/api/media/{avatars|covers|media}/file` → `uploads/.../file`.
 * Legacy `/api/media/banners/...` maps to `uploads/covers/...` (adblock-safe rename).
 * Returns null for empty, foreign, or malformed URLs.
 */
export const mediaApiUrlToUploadRelative = (
  mediaUrl: string | null | undefined
): string | null => {
  if (!mediaUrl) return null;
  const normalized = mediaUrl.replace(/\\/g, "/").trim();
  const match = normalized.match(
    /^\/api\/media\/(avatars|covers|banners|media)\/([^/]+)$/
  );
  if (!match) return null;
  const folder = match[1] === "banners" ? "covers" : match[1];
  return `uploads/${folder}/${match[2]}`;
};

/** Rewrite stored banner URLs that still use the adblock-triggering segment. */
export const canonicalizeMediaApiUrl = (
  mediaUrl: string | null | undefined
): string | null | undefined => {
  if (!mediaUrl) return mediaUrl;
  return mediaUrl.replace(/^\/api\/media\/banners\//, "/api/media/covers/");
};

/**
 * Resolve `target` and require it to stay under `<baseDir>/uploads`.
 * Returns the resolved absolute path, or null when outside the root.
 */
export const resolveUnderUploadsRoot = (
  baseDir: string,
  target: string
): string | null => {
  const uploadsRoot = path.resolve(baseDir, "uploads");
  const resolved = path.resolve(target);
  if (resolved === uploadsRoot || resolved.startsWith(uploadsRoot + path.sep)) {
    return resolved;
  }
  return null;
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

export const safeUnlinkMediaApiUrl = async (
  baseDir: string,
  mediaUrl: string | null | undefined
): Promise<void> => {
  await safeUnlinkFromServerRoot(baseDir, mediaApiUrlToUploadRelative(mediaUrl));
};
