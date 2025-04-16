import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import {
  FILE_LIMITS,
  ALLOWED_FILE_TYPES,
  UPLOAD_PATHS,
} from "../constants/fileConstants.js";

// Базовая конфигурация
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Обработка изображений
const processImage = async (file) => {
  if (!file.mimetype.startsWith("image/")) return file.buffer;

  return await sharp(file.buffer)
    .resize(1200, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
};

// Конфигурация хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    switch (file.fieldname) {
      case "avatar":
        uploadPath = path.join(__dirname, "..", UPLOAD_PATHS.AVATARS);
        break;
      case "banner":
        uploadPath = path.join(__dirname, "..", UPLOAD_PATHS.BANNERS);
        break;
      default:
        uploadPath = path.join(__dirname, "..", UPLOAD_PATHS.MEDIA);
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.ALL.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Неподдерживаемый формат файла"));
  }
};

// Базовые ограничения
const limits = {
  fileSize: FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE,
  files: 1,
};

// Экспорт конфигураций для разных типов загрузок
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
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.IMAGES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Разрешены только изображения"));
    }
  },
  limits: { ...limits, fileSize: FILE_LIMITS.AVATAR_MAX_SIZE }, // 5MB для аватаров
}).single("avatar");

export default {
  mediaUpload,
  profileUpload,
  avatarUpload,
  processImage,
};
