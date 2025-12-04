import { fileTypeFromBuffer } from "file-type";
import fs from "fs/promises";

// Magic bytes validation mapping
const MAGIC_BYTES_MAP = {
  // Images
  "image/jpeg": ["image/jpeg"],
  "image/png": ["image/png"],
  "image/gif": ["image/gif"],
  // Videos
  "video/mp4": ["video/mp4"],
  "video/webm": ["video/webm"],
  // Audio
  "audio/webm": ["audio/webm", "video/webm"], // webm can be detected as video
  "audio/mp3": ["audio/mpeg"],
  "audio/mpeg": ["audio/mpeg"],
  "audio/wav": ["audio/wav", "audio/x-wav"],
  "audio/ogg": ["audio/ogg", "application/ogg"],
};

/**
 * Middleware для валидации magic bytes загруженных файлов
 * Должен использоваться ПОСЛЕ multer middleware
 */
export const validateFileMagicBytes = async (req, res, next) => {
  try {
    const files = [];

    // Collect all uploaded files
    if (req.file) {
      files.push(req.file);
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        // req.files is an object with field names as keys
        Object.values(req.files).forEach((fieldFiles) => {
          if (Array.isArray(fieldFiles)) {
            files.push(...fieldFiles);
          }
        });
      }
    }

    if (files.length === 0) {
      return next();
    }

    for (const file of files) {
      // Read file from disk
      const buffer = await fs.readFile(file.path);
      const detectedType = await fileTypeFromBuffer(buffer);

      if (!detectedType) {
        // Delete uploaded file
        await fs.unlink(file.path).catch(() => {});
        return res.status(400).json({
          message: `Не удалось определить тип файла: ${file.originalname}`,
        });
      }

      const declaredMime = file.mimetype;
      const validMimes = MAGIC_BYTES_MAP[declaredMime] || [declaredMime];

      if (!validMimes.includes(detectedType.mime)) {
        // Delete uploaded file - potential spoofing attempt
        await fs.unlink(file.path).catch(() => {});
        console.warn(
          `[Security] File type mismatch: declared=${declaredMime}, detected=${detectedType.mime}, file=${file.originalname}`
        );
        return res.status(400).json({
          message: `Тип файла не соответствует содержимому: ${file.originalname}`,
        });
      }
    }

    next();
  } catch (error) {
    console.error("[validateFileMagicBytes] Error:", error);
    // On error, reject the upload to be safe
    return res.status(500).json({
      message: "Ошибка при проверке файла",
    });
  }
};

export default validateFileMagicBytes;
