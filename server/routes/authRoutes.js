import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Убираем префикс /auth, так как он уже добавлен в index.js
router.post("/register", register);
router.post("/login", login);

export default router;
