import { Router } from "express";
import { getE2eeKey, putE2eeKey } from "../controllers/e2eeController.js";
import protect from "../middleware/auth.js";
import { keyLimiter, readLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.get("/keys/:userId", readLimiter, protect, getE2eeKey);
router.put("/keys", keyLimiter, protect, putE2eeKey);

export default router;
