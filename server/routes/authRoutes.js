import express from "express";
import multer from "multer";
import { register, login } from "../controllers/authController.js";
import upload from "../config/multer.js";

const router = express.Router();

router.post("/register", (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Ошибка Multer
      return res.status(400).json({
        message: "Ошибка при загрузке файла",
        error: err.message,
      });
    } else if (err) {
      // Другая ошибка
      return res.status(400).json({
        message: "Ошибка при загрузке файла",
        error: err.message,
      });
    }
    // Всё хорошо, продолжаем
    register(req, res, next);
  });
});

router.post("/login", login);

export default router;
