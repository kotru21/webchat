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
