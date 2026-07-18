import path from "node:path";
import { fileTypeFromFile } from "file-type";
import type { NextFunction, Request, Response } from "express";
import { FILE_LIMITS, UPLOAD_PATHS } from "../constants/fileConstants.js";
import {
  finalizeNonImageUpload,
  isImageMime,
  reencodeImageToWebp,
} from "../services/uploadPipeline.js";
import {
  collectUploadedFiles,
  unlinkUploadedFiles,
} from "../utils/uploadedFiles.js";

const outputDirForField = (fieldname: string): string => {
  switch (fieldname) {
    case "avatar":
      return path.join(process.cwd(), UPLOAD_PATHS.AVATARS);
    case "banner":
      return path.join(process.cwd(), UPLOAD_PATHS.BANNERS);
    default:
      return path.join(process.cwd(), UPLOAD_PATHS.MEDIA);
  }
};

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

const profileSizeError = (file: Express.Multer.File): string | null => {
  if (file.fieldname === "avatar" && file.size > FILE_LIMITS.AVATAR_MAX_SIZE) {
    return "Аватар слишком большой (макс. 5 МБ)";
  }
  if (file.fieldname === "banner" && file.size > FILE_LIMITS.BANNER_MAX_SIZE) {
    return "Баннер слишком большой (макс. 10 МБ)";
  }
  return null;
};

const extensionFromDetected = (detectedExt: string): string => {
  const cleaned = detectedExt.replace(/^\./, "").toLowerCase();
  return cleaned ? `.${cleaned}` : ".bin";
};

const applyPipelineToFile = async (
  file: Express.Multer.File,
  detectedExt: string
): Promise<void> => {
  const outputDir = outputDirForField(file.fieldname);

  if (isImageMime(file.mimetype) || file.mimetype.startsWith("image/")) {
    const result = await reencodeImageToWebp(file.path, outputDir);
    file.filename = result.filename;
    file.path = path.join(process.cwd(), result.relativePath);
    file.mimetype = "image/webp";
    return;
  }

  if (file.fieldname === "media") {
    const ext = extensionFromDetected(detectedExt);
    const result = await finalizeNonImageUpload(file.path, ext, outputDir);
    file.filename = result.filename;
    file.path = path.join(process.cwd(), result.relativePath);
  }
};

export const validateFileMagicBytes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const files = collectUploadedFiles(req);

  if (files.length === 0) {
    next();
    return;
  }

  try {
    for (const file of files) {
      const sizeError = profileSizeError(file);
      if (sizeError) {
        await unlinkUploadedFiles(files);
        res.status(400).json({ message: sizeError });
        return;
      }

      // file-type reads only a small prefix — avoid loading up to 50MB into RAM.
      const detectedType = await fileTypeFromFile(file.path);

      if (!detectedType) {
        await unlinkUploadedFiles(files);
        res.status(400).json({
          message: `Не удалось определить тип файла: ${file.originalname}`,
        });
        return;
      }

      const declaredMime = file.mimetype;
      const validMimes = MAGIC_BYTES_MAP[declaredMime] ?? [declaredMime];

      if (!validMimes.includes(detectedType.mime)) {
        await unlinkUploadedFiles(files);
        res.status(400).json({
          message: `Тип файла не соответствует содержимому: ${file.originalname}`,
        });
        return;
      }

      await applyPipelineToFile(file, detectedType.ext);
    }

    next();
  } catch (error) {
    await unlinkUploadedFiles(files);
    next(error);
  }
};
