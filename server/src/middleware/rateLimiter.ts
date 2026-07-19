import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const isDevelopment = env.NODE_ENV !== "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 15,
  message: { message: "Слишком много попыток входа. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Слишком много сообщений. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 5,
  message: {
    message: "Слишком много попыток обновления профиля. Попробуйте позже.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 30,
  message: { message: "Слишком много запросов обновления сессии." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 10_000 : 30,
  message: { message: "Слишком много поисковых запросов. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 60,
  message: { message: "Слишком много запросов выхода." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Authenticated read endpoints (profiles, chat/message lists). */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 10_000 : 120,
  message: { message: "Слишком много запросов. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Media GETs burst hard (avatar per chat row) — higher ceiling than readLimiter. */
export const mediaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDevelopment ? 10_000 : 300,
  message: { message: "Слишком много запросов медиа. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Block / unblock mutations. */
export const blockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 30,
  message: { message: "Слишком много запросов блокировки. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** E2EE public-key upserts (identity rotation is rare). */
export const keyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10_000 : 10,
  message: { message: "Слишком много обновлений ключа. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});
