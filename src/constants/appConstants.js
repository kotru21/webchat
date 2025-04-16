/**
 * Константы приложения WebChat
 */

// Ограничения загрузки файлов
export const FILE_LIMITS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  BANNER_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MESSAGE_MEDIA_MAX_SIZE: 50 * 1024 * 1024, // 50MB
};

// Задержки анимаций
export const ANIMATION_DELAYS = {
  CHAT_TRANSITION: 300, // мс
  PROFILE_PREVIEW: 100, // мс
};

// API URL
export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || "",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      ME: "/api/auth/me",
      USERS: "/api/auth/users",
    },
    CHAT: {
      MESSAGES: "/api/messages",
      PIN_MESSAGE: "/api/messages/pin",
    },
    STATUS: "/api/status",
  },
};

// Таймауты
export const TIMEOUTS = {
  MEDIA_LOAD: 5000, // мс
  ACTIVITY_UPDATE: 60000, // мс (1 минута)
};

// Ограничения ввода
export const INPUT_LIMITS = {
  USERNAME_MAX_LENGTH: 32,
  DESCRIPTION_MAX_LENGTH: 500,
  MESSAGE_MAX_LENGTH: 2000,
};

// Конфигурация форматирования дат
export const DATE_FORMAT_OPTIONS = {
  full: {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  time: {
    hour: "2-digit",
    minute: "2-digit",
  },
};

export default {
  FILE_LIMITS,
  ANIMATION_DELAYS,
  API,
  TIMEOUTS,
  INPUT_LIMITS,
  DATE_FORMAT_OPTIONS,
};
