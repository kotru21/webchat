export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024,
  BANNER_MAX_SIZE: 10 * 1024 * 1024,
  MESSAGE_MEDIA_MAX_SIZE: 50 * 1024 * 1024,
  VOICE_MESSAGE_MAX_SIZE: 10 * 1024 * 1024,
  VOICE_MESSAGE_MAX_DURATION: 180,
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif"],
  VIDEOS: ["video/mp4", "video/webm"],
  AUDIO: ["audio/webm", "audio/mp3", "audio/wav", "audio/ogg", "audio/mpeg"],
  get ALL() {
    return [...this.IMAGES, ...this.VIDEOS, ...this.AUDIO];
  },
};

export const UPLOAD_PATHS = {
  AVATARS: "uploads/avatars",
  /** Profile cover images. Named "covers" — "banners" is blocked by common adblockers. */
  COVERS: "uploads/covers",
  MEDIA: "uploads/media",
} as const;
