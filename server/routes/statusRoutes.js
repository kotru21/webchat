import express from "express";
import {
  getUserStatus,
  updateStatus,
  updateActivity,
} from "../controllers/statusController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getUserStatus);
router.put("/update", protect, updateStatus);
router.put("/activity", protect, updateActivity);

export default router;
