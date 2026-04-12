import multer from "multer";
import path from "node:path";
import { ALLOWED_FILE_TYPES, FILE_LIMITS, UPLOAD_PATHS } from "../constants/fileConstants.js";

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
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_FILE_TYPES.ALL.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Неподдерживаемый формат файла"));
};

const limits: multer.Options["limits"] = {
  fileSize: FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE,
  files: 1,
};

export const mediaUpload = multer({
  storage,
  fileFilter,
  limits: { ...limits, files: 1 },
}).single("media");

export const profileUpload = multer({
  storage,
  fileFilter,
  limits,
}).fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

export const avatarUpload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_FILE_TYPES.IMAGES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Разрешены только изображения"));
  },
  limits: {
    ...limits,
    fileSize: FILE_LIMITS.AVATAR_MAX_SIZE,
  },
}).single("avatar");
