import express from "express";
import {
  register,
  login,
  updateProfile,
  getUserProfile,
  logout,
  refreshAccessToken,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import { profileUpload, avatarUpload } from "../config/multer.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { validateFileMagicBytes } from "../middleware/fileValidator.js";

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  avatarUpload,
  validateFileMagicBytes,
  register
);
router.post("/login", authLimiter, login);
router.post("/logout", auth, logout);
router.post("/refresh", refreshAccessToken);
router.put(
  "/profile",
  auth,
  authLimiter,
  profileUpload,
  validateFileMagicBytes,
  updateProfile
);
router.get("/users/:id", auth, getUserProfile);
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

export default router;
