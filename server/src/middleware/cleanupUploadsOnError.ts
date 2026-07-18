import type { RequestHandler } from "express";
import {
  collectUploadedFiles,
  unlinkUploadedFiles,
} from "../utils/uploadedFiles.js";

/**
 * After multer, drop on-disk uploads when the response is an error.
 * Covers validate* 400s that run after the file was already written.
 */
export const cleanupUploadsOnError: RequestHandler = (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode < 400) return;
    const files = collectUploadedFiles(req);
    if (files.length === 0) return;
    void unlinkUploadedFiles(files);
  });
  next();
};
