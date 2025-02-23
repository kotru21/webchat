import rateLimit from "express-rate-limit";

// Лимит для аутентификации (логин/регистрация)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток
  message: { message: "Слишком много попыток входа. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для сообщений
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30, // 30 сообщений в минуту
  message: { message: "Слишком много сообщений. Подождите немного." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Общий лимит для всех API запросов
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // 100 запросов в минуту
  message: { message: "Слишком много запросов. Попробуйте позже." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Лимит для обновления профиля
export const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // 5 попыток обновления
  message: {
    message: "Слишком много попыток обновления профиля. Попробуйте позже.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
