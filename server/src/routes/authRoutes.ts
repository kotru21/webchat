import { Router } from "express";
import {
  getMe,
  getUserProfile,
  login,
  logout,
  logoutAll,
  refreshAccessToken,
  register,
  searchUsers,
  updateProfile,
} from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import { cleanupUploadsOnError } from "../middleware/cleanupUploadsOnError.js";
import { validateFileMagicBytes } from "../middleware/fileValidator.js";
import {
  authLimiter,
  logoutLimiter,
  profileLimiter,
  readLimiter,
  refreshLimiter,
  searchLimiter,
} from "../middleware/rateLimiter.js";
import { requireSameOrigin } from "../middleware/requireSameOrigin.js";
import { avatarUpload, profileUpload } from "../middleware/upload.js";
import {
  validateLogin,
  validateProfile,
  validateRegister,
} from "../middleware/validator.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  avatarUpload,
  cleanupUploadsOnError,
  validateFileMagicBytes,
  validateRegister,
  register
);
router.post("/login", authLimiter, validateLogin, login);
// No `protect`: expired access JWT must still clear refresh cookie + revoke family.
// requireSameOrigin: CSRF guard for the cookie-authenticated endpoints.
router.post("/logout", logoutLimiter, requireSameOrigin, logout);
// Bearer-only ⇒ no CSRF middleware (invariant 7).
// Rate limit before protect so unauthenticated spam is throttled (CodeQL).
router.post("/logout-all", logoutLimiter, protect, logoutAll);
router.post("/refresh", refreshLimiter, requireSameOrigin, refreshAccessToken);
router.put(
  "/profile",
  protect,
  profileLimiter,
  profileUpload,
  cleanupUploadsOnError,
  validateFileMagicBytes,
  validateProfile,
  updateProfile
);
router.get("/users", protect, searchLimiter, searchUsers);
router.get("/users/:id", protect, readLimiter, getUserProfile);
router.get("/me", protect, readLimiter, getMe);

export default router;
