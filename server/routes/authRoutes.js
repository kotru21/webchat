import express from "express";
import {
  updateProfile,
  getUserProfile,
} from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

router.put("/profile", auth, uploadFields, updateProfile);
router.get("/users/:id", auth, getUserProfile);
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

export default router;
