import express from "express";
import {
  register,
  login,
  updateProfile,
  getUserProfile,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
import { authLimiter, profileLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

router.post("/register", authLimiter, upload.single("avatar"), register);

// Вход с лимитом
router.post("/login", authLimiter, login);

// Обновление профиля с лимитом
router.put("/profile", auth, upload.single("avatar"), async (req, res) => {
  try {
    const { username } = req.body;
    const user = req.user; // Предполагается, что auth middleware добавляет пользователя в req

    if (username) user.username = username;
    if (req.file) user.avatar = `/uploads/avatars/${req.file.filename}`;

    await user.save();
    res.json(user); // Возвращаем обновленного пользователя
  } catch (error) {
    res.status(500).json({ message: "Ошибка обновления профиля" });
  }
});

router.put("/profile", auth, uploadFields, updateProfile);
router.get("/users/:id", auth, getUserProfile);
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

export default router;
