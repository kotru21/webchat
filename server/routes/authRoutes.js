import express from "express";
import {
  register,
  login,
  updateProfile,
  getUserProfile,
  logout,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import { profileUpload, avatarUpload } from "../config/multer.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, avatarUpload, register);
router.post("/login", authLimiter, login);
router.post("/logout", auth, logout);
router.put("/profile", auth, authLimiter, profileUpload, updateProfile);
router.get("/users/:id", auth, getUserProfile);
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

export default router;
