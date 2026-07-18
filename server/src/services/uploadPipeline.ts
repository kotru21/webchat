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

/** Cap decoded raster size to bound RAM (DoS via decompression bombs). */
export const IMAGE_LIMIT_INPUT_PIXELS = 40_000_000;
/** Longest edge after re-encode — keeps memory and disk bounded. */
export const IMAGE_MAX_DIMENSION = 4096;

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

  const sharpOpts = {
    animated: true,
    limitInputPixels: IMAGE_LIMIT_INPUT_PIXELS,
  } as const;

  const meta = await sharp(inputPath, sharpOpts).metadata();
  const isAnimated = (meta.pages ?? 1) > 1;

  // Fresh instance after metadata() — avoids Windows file-lock on unlink.
  let pipeline = sharp(inputPath, sharpOpts);
  // EXIF rotate can break multi-frame toilet-roll layout.
  if (!isAnimated) {
    pipeline = pipeline.rotate();
  }

  // Height cap on animated input scales the whole stack and drops frames —
  // constrain width only; stills use both axes.
  pipeline = pipeline.resize({
    width: IMAGE_MAX_DIMENSION,
    ...(isAnimated ? {} : { height: IMAGE_MAX_DIMENSION }),
    fit: "inside",
    withoutEnlargement: true,
  });

  await pipeline.webp({ quality: 80 }).toFile(outputPath);

  // Windows may keep the input handle briefly after sharp finishes.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.unlink(inputPath);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

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
