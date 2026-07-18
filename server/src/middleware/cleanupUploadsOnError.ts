import type { RequestHandler } from "express";
import {
  collectUploadedFiles,
  unlinkUploadedFiles,
} from "../utils/uploadedFiles.js";

/**
 * After multer, drop on-disk uploads when the response is an error
 * or the client aborts before the response finishes.
 */
export const cleanupUploadsOnError: RequestHandler = (req, res, next) => {
  let settled = false;

  const cleanup = () => {
    if (settled) return;
    settled = true;
    const files = collectUploadedFiles(req);
    if (files.length === 0) return;
    void unlinkUploadedFiles(files);
  };

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      cleanup();
    } else {
      settled = true;
    }
  });

  res.on("close", () => {
    // Aborted / dropped connection — finish may never run.
    if (!res.writableEnded) {
      cleanup();
    }
  });

  next();
};
