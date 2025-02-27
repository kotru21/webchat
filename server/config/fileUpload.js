import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed file types
const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedVideoTypes = ["video/mp4", "video/webm"];

// Process image function for optimization
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

// File destination handler
const getDestination = (fieldname) => {
  return path.join(
    __dirname,
    "..",
    "uploads",
    fieldname === "avatar" ? "avatars" : "media"
  );
};

// Disk storage configuration
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getDestination(file.fieldname));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Неподдерживаемый формат файла"));
  }
};

// Upload limits
const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB limit
  files: 1,
};

// Create and export multer instance
export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits,
});

// Export helper functions and configurations for use in other modules
export { processImage, allowedImageTypes, allowedVideoTypes, getDestination };
