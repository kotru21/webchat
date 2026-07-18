import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_PATHS } from "../constants/fileConstants.js";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export const isImageMime = (mime: string): boolean => IMAGE_MIMES.has(mime);

export const randomUploadFilename = (extension: string): string => {
  const id = crypto.randomBytes(16).toString("hex");
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${id}${ext}`;
};

export const reencodeImageToWebp = async (
  inputPath: string,
  outputDir = path.join(process.cwd(), UPLOAD_PATHS.MEDIA)
): Promise<{ relativePath: string; filename: string }> => {
  await fs.mkdir(outputDir, { recursive: true });
  const filename = randomUploadFilename(".webp");
  const outputPath = path.join(outputDir, filename);

  await sharp(inputPath).rotate().webp({ quality: 80 }).toFile(outputPath);
  await fs.unlink(inputPath).catch(() => undefined);

  return {
    filename,
    relativePath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
  };
};

export const finalizeNonImageUpload = async (
  inputPath: string,
  originalExt: string,
  outputDir = path.join(process.cwd(), UPLOAD_PATHS.MEDIA)
): Promise<{ relativePath: string; filename: string }> => {
  await fs.mkdir(outputDir, { recursive: true });
  const filename = randomUploadFilename(originalExt || ".bin");
  const outputPath = path.join(outputDir, filename);
  await fs.rename(inputPath, outputPath);

  return {
    filename,
    relativePath: path.relative(process.cwd(), outputPath).replace(/\\/g, "/"),
  };
};
