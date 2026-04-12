import { Router } from "express";
import { getUserChats } from "../controllers/chatController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.get("/", protect, getUserChats);

export default router;
