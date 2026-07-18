import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import protect from "../middleware/auth.js";
import { assertCanAccessMediaAttachment } from "../services/accessControl.js";
import { createHttpError } from "../utils/errors.js";

const router = Router();

interface SafeUploadPath {
  root: string;
  relative: string;
  fullPath: string;
}

const rejectUnsafeRelative = (normalized: string): void => {
  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    path.isAbsolute(normalized)
  ) {
    throw createHttpError(400, "Некорректный путь медиа", "INVALID_MEDIA_PATH");
  }
};

const assertUnderRoot = (fullPath: string, uploadsRoot: string): string => {
  if (!fullPath.startsWith(uploadsRoot + path.sep) && fullPath !== uploadsRoot) {
    throw createHttpError(403, "Доступ запрещён", "MEDIA_FORBIDDEN");
  }
  const relative = path.relative(uploadsRoot, fullPath).replace(/\\/g, "/");
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw createHttpError(403, "Доступ запрещён", "MEDIA_FORBIDDEN");
  }
  return relative;
};

const resolveSafeUploadPath = (requestPath: string): SafeUploadPath => {
  const normalized = requestPath.replace(/^\/+/, "").replace(/\\/g, "/");
  rejectUnsafeRelative(normalized);
  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  const fullPath = path.resolve(uploadsRoot, normalized);
  const relative = assertUnderRoot(fullPath, uploadsRoot);
  return { root: uploadsRoot, relative, fullPath };
};

const isMessageAttachmentPath = (relative: string): boolean =>
  relative === "media" || relative.startsWith("media/");

router.get("/*path", protect, async (req, res, next) => {
  try {
    const rawPath = Array.isArray(req.params.path)
      ? req.params.path.join("/")
      : String(req.params.path ?? "");
    const { root, relative, fullPath } = resolveSafeUploadPath(rawPath);

    // Attachments under media/: DM participants only (IDOR guard).
    // Avatars/banners: any authenticated user (intentional product split).
    if (isMessageAttachmentPath(relative)) {
      const userId = req.user?.id;
      if (!userId) {
        throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
      }
      await assertCanAccessMediaAttachment(userId, `/api/media/${relative}`);
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      throw createHttpError(404, "Файл не найден", "MEDIA_NOT_FOUND");
    }
    // Confine sendFile to uploads/ via root; relative is post-canonicalize.
    res.sendFile(relative, { root });
  } catch (error) {
    next(error);
  }
});

export default router;
