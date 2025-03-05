import express from "express";
import {
  register,
  login,
  updateProfile,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";
import { authLimiter, profileLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Регистрация с лимитом
router.post("/register", authLimiter, upload.single("avatar"), register);

// Вход с лимитом
router.post("/login", authLimiter, login);

// Обновление профиля с лимитом
router.put(
  "/profile",
  protect,
  profileLimiter,
  upload.single("avatar"),
  updateProfile
);

export default router;
