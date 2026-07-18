import crypto from "node:crypto";
import multer from "multer";
import path from "node:path";
import { ALLOWED_FILE_TYPES, FILE_LIMITS, UPLOAD_PATHS } from "../constants/fileConstants.js";

/** Temp name only — final extension comes from magic-bytes / re-encode pipeline. */
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let uploadPath: string;

    switch (file.fieldname) {
      case "avatar":
        uploadPath = UPLOAD_PATHS.AVATARS;
        break;
      case "banner":
        uploadPath = UPLOAD_PATHS.BANNERS;
        break;
      default:
        uploadPath = UPLOAD_PATHS.MEDIA;
    }

    cb(null, path.join(process.cwd(), uploadPath));
  },
  filename: (_req, _file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString("hex")}.bin`);
  },
});

const mediaFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.ALL.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Неподдерживаемый формат файла"));
};

const imageFileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.IMAGES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Разрешены только изображения"));
};

/** Cap multipart text fields well above message max (1000) but far below multer's 1MB default. */
const MESSAGE_FIELD_SIZE = 4 * 1024;

export const mediaUpload = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE,
    fieldSize: MESSAGE_FIELD_SIZE,
    files: 1,
  },
}).single("media");

export const profileUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    // Per-file multer cap; avatar tightened further in validateFileMagicBytes.
    fileSize: FILE_LIMITS.BANNER_MAX_SIZE,
    files: 2,
  },
}).fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

export const avatarUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_LIMITS.AVATAR_MAX_SIZE,
    files: 1,
  },
}).single("avatar");
