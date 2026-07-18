import { Router } from "express";
import { getUserChats } from "../controllers/chatController.js";
import protect from "../middleware/auth.js";
import { readLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/", protect, readLimiter, getUserChats);

export default router;
