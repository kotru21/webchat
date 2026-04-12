import { Router } from "express";
import {
  createMessageHandler,
  deleteMessage,
  getMessages,
  markAsRead,
  pinMessage,
  updateMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/auth.js";
import { validateFileMagicBytes } from "../middleware/fileValidator.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import { mediaUpload } from "../middleware/upload.js";
import { validateMessage } from "../middleware/validator.js";

const router = Router();

router.get("/", protect, getMessages);
router.post(
  "/",
  protect,
  messageLimiter,
  validateMessage,
  mediaUpload,
  validateFileMagicBytes,
  createMessageHandler
);
router.put(
  "/:messageId",
  protect,
  messageLimiter,
  validateMessage,
  mediaUpload,
  validateFileMagicBytes,
  updateMessage
);
router.put("/:messageId/pin", protect, pinMessage);
router.delete("/:messageId", protect, deleteMessage);
router.post("/:messageId/read", protect, markAsRead);

export default router;
