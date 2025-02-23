import express from "express";
import {
  register,
  login,
  updateProfile,
} from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// Регистрация с поддержкой загрузки аватара
router.post("/register", upload.single("avatar"), register);

// Вход
router.post("/login", login);

// Обновление профиля
router.put("/profile", protect, upload.single("avatar"), updateProfile);

export default router;
