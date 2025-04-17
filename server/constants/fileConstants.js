/**
 * Константы сервера WebChat
 */

// Ограничения загрузки файлов
export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  BANNER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MESSAGE_MEDIA_MAX_SIZE: 50 * 1024 * 1024, // 50MB
  VOICE_MESSAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  VOICE_MESSAGE_MAX_DURATION: 180, // 180 секунд (3 минуты)
};

// Разрешенные типы файлов
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif"],
  VIDEOS: ["video/mp4", "video/webm"],
  AUDIO: ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg"],
  get ALL() {
    return [...this.IMAGES, ...this.VIDEOS, ...this.AUDIO];
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
