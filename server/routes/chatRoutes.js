import express from "express";
import { getUserChats } from "../controllers/chatController.js";
import protect from "../middleware/authMiddleware.js"; // Исправлено: было { protect }

const router = express.Router();

// Получение списка чатов пользователя
router.get("/", protect, getUserChats);

export default router;
