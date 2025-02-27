import express from "express";
import {
  getMessages,
  saveMessage,
  markAsRead,
  updateMessage,
  deleteMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/fileUpload.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import { validateMessage } from "../middleware/validator.js";

const router = express.Router();

// Get messages route
router.get("/", protect, getMessages);

// Save message route
router.post(
  "/",
  protect,
  messageLimiter,
  validateMessage,
  upload.single("media"),
  saveMessage
);

// Update message route
router.put(
  "/:messageId",
  protect,
  messageLimiter,
  validateMessage,
  upload.single("media"),
  updateMessage
);

// Delete message route
router.delete("/:messageId", protect, deleteMessage);

// Mark message as read route
router.post("/:messageId/read", protect, markAsRead);

export default router;
