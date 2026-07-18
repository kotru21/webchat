import fs from "node:fs/promises";
import type { Request } from "express";
import { resolveUnderUploadsRoot } from "./uploads.js";

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
  // Multer writes under uploads/ only; enforce that invariant before unlink.
  const safePaths = files
    .map((file) => resolveUnderUploadsRoot(process.cwd(), file.path))
    .filter((resolved): resolved is string => resolved !== null);

  await Promise.all(
    safePaths.map((resolved) => fs.unlink(resolved).catch(() => undefined))
  );
};
