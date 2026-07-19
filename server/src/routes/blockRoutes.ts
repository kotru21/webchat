import { Router } from "express";
import {
  createBlock,
  listBlocks,
  removeBlock,
} from "../controllers/blockController.js";
import protect from "../middleware/auth.js";
import { blockLimiter, readLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/", protect, readLimiter, listBlocks);
router.post("/:userId", protect, blockLimiter, createBlock);
router.delete("/:userId", protect, blockLimiter, removeBlock);

export default router;
