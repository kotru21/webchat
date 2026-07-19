import { Router } from "express";
import {
  createBlock,
  listBlocks,
  removeBlock,
} from "../controllers/blockController.js";
import protect from "../middleware/auth.js";
import { blockLimiter, readLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// Rate limit before protect so unauthenticated spam is throttled (CodeQL).
router.get("/", readLimiter, protect, listBlocks);
router.post("/:userId", blockLimiter, protect, createBlock);
router.delete("/:userId", blockLimiter, protect, removeBlock);

export default router;
