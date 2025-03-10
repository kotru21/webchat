import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

// Базовая конфигурация
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Константы
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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
        uploadPath = path.join(__dirname, "../uploads/avatars");
        break;
      case "banner":
        uploadPath = path.join(__dirname, "../uploads/banners");
        break;
      default:
        uploadPath = path.join(__dirname, "../uploads/media");
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
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Неподдерживаемый формат файла"));
  }
};

// Ограничения
const limits = {
  fileSize: MAX_FILE_SIZE,
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
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Разрешены только изображения"));
    }
  },
  limits: { ...limits, fileSize: 5 * 1024 * 1024 }, // 5MB для аватаров
}).single("avatar");

export default {
  mediaUpload,
  profileUpload,
  avatarUpload,
  processImage,
};
