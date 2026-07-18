import { Router } from "express";
import {
  getMe,
  getUserProfile,
  login,
  logout,
  refreshAccessToken,
  register,
  searchUsers,
  updateProfile,
} from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import { validateFileMagicBytes } from "../middleware/fileValidator.js";
import { authLimiter, profileLimiter, refreshLimiter } from "../middleware/rateLimiter.js";
import { avatarUpload, profileUpload } from "../middleware/upload.js";
import { validateLogin, validateRegister } from "../middleware/validator.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  avatarUpload,
  validateFileMagicBytes,
  validateRegister,
  register
);
router.post("/login", authLimiter, validateLogin, login);
// No `protect`: expired access JWT must still clear refresh cookie + revoke sessions.
router.post("/logout", logout);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.put(
  "/profile",
  protect,
  profileLimiter,
  profileUpload,
  validateFileMagicBytes,
  updateProfile
);
router.get("/users", protect, searchUsers);
router.get("/users/:id", protect, getUserProfile);
router.get("/me", protect, getMe);

export default router;
