import fs from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
import type { RequestHandler } from "express";

const MAGIC_BYTES_MAP: Record<string, string[]> = {
  "image/jpeg": ["image/jpeg"],
  "image/png": ["image/png"],
  "image/gif": ["image/gif"],
  "video/mp4": ["video/mp4"],
  "video/webm": ["video/webm"],
  "audio/webm": ["audio/webm", "video/webm"],
  "audio/mp3": ["audio/mpeg"],
  "audio/mpeg": ["audio/mpeg"],
  "audio/wav": ["audio/wav", "audio/x-wav"],
  "audio/ogg": ["audio/ogg", "application/ogg"],
};

const collectUploadedFiles = (req: Express.Request) => {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      for (const fieldFiles of Object.values(req.files)) {
        if (Array.isArray(fieldFiles)) {
          files.push(...fieldFiles);
        }
      }
    }
  }

  return files;
};

export const validateFileMagicBytes: RequestHandler = async (req, res, next) => {
  const files = collectUploadedFiles(req);

  if (files.length === 0) {
    return next();
  }

  try {
    for (const file of files) {
      const buffer = await fs.readFile(file.path);
      const detectedType = await fileTypeFromBuffer(buffer);

      if (!detectedType) {
        await fs.unlink(file.path).catch(() => undefined);
        return res.status(400).json({
          message: `Не удалось определить тип файла: ${file.originalname}`,
        });
      }

      const declaredMime = file.mimetype;
      const validMimes = MAGIC_BYTES_MAP[declaredMime] ?? [declaredMime];

      if (!validMimes.includes(detectedType.mime)) {
        await fs.unlink(file.path).catch(() => undefined);
        return res.status(400).json({
          message: `Тип файла не соответствует содержимому: ${file.originalname}`,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Ошибка при проверке файла",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    });
  }
};
