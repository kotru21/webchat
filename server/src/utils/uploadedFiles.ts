import fs from "node:fs/promises";
import type { Request } from "express";

export const collectUploadedFiles = (req: Request): Express.Multer.File[] => {
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

export const unlinkUploadedFiles = async (
  files: Express.Multer.File[]
): Promise<void> => {
  await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => undefined)));
};
