import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === "avatar") {
      uploadPath = path.join(__dirname, "../uploads/avatars");
    } else if (file.fieldname === "banner") {
      uploadPath = path.join(__dirname, "../uploads/banners");
    } else {
      uploadPath = path.join(__dirname, "../uploads/media");
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
  const allowedVideoTypes = ["video/mp4", "video/webm"];

  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Неподдерживаемый формат файла"));
  }
};

const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB для видео
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});

export default upload;
