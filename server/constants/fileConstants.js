/**
 * Константы сервера WebChat
 */

// Ограничения загрузки файлов
export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  BANNER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MESSAGE_MEDIA_MAX_SIZE: 50 * 1024 * 1024, // 50MB
};

// Разрешенные типы файлов
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif"],
  VIDEOS: ["video/mp4", "video/webm"],
  get ALL() {
    return [...this.IMAGES, ...this.VIDEOS];
  },
};

// Пути для загрузки файлов
export const UPLOAD_PATHS = {
  AVATARS: "uploads/avatars",
  BANNERS: "uploads/banners",
  MEDIA: "uploads/media",
};

export default {
  FILE_LIMITS,
  ALLOWED_FILE_TYPES,
  UPLOAD_PATHS,
};
