import express from "express";
import {
  register,
  login,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";
import { authLimiter, profileLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Регистрация с лимитом
router.post("/register", authLimiter, upload.single("avatar"), register);

// Вход с лимитом
router.post("/login", authLimiter, login);

// Верификация email
router.get("/verify/:token", verifyEmail);

// Повторная отправка верификации
router.post("/resend-verification", authLimiter, resendVerification);

// Забыли пароль
router.post("/forgot-password", authLimiter, forgotPassword);

// Сброс пароля
router.post("/reset-password", authLimiter, resetPassword);

// Обновление профиля с лимитом
router.put(
  "/profile",
  protect,
  profileLimiter,
  upload.single("avatar"),
  updateProfile
);

export default router;
