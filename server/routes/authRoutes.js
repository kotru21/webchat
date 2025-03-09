import express from "express";
import {
  register,
  login,
  updateProfile,
  getUserProfile,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
import { authLimiter, profileLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

router.post("/register", authLimiter, upload.single("avatar"), register);

router.post("/login", authLimiter, login);

router.put("/profile", auth, authLimiter, uploadFields, updateProfile);
router.get("/users/:id", auth, getUserProfile);
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

export default router;
