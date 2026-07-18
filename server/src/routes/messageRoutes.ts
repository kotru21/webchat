import { Router } from "express";
import {
  createMessageHandler,
  getMessages,
} from "../controllers/messageController.js";
import protect from "../middleware/auth.js";
import { cleanupUploadsOnError } from "../middleware/cleanupUploadsOnError.js";
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
  // Multer must run first so multipart fields exist for validateMessage.
  mediaUpload,
  cleanupUploadsOnError,
  validateMessage,
  validateFileMagicBytes,
  createMessageHandler
);

export default router;
