import express from "express";
import { getMessages, saveMessage } from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/mediaUpload.js";

const router = express.Router();

router.get("/", protect, getMessages);

router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const messageData = {
      sender: req.user._id,
      senderUsername: req.user.username || req.user.email,
      content: req.body.text || "",
      roomId: "general",
    };

    if (req.file) {
      messageData.mediaUrl = `/uploads/media/${req.file.filename}`;
      messageData.mediaType = req.file.mimetype.startsWith("image/")
        ? "image"
        : "video";
    }

    // Проверка на наличие контента или медиа
    if (!messageData.content && !messageData.mediaUrl) {
      return res.status(400).json({
        message: "Сообщение должно содержать текст или медиафайл",
      });
    }

    const savedMessage = await saveMessage(messageData);
    req.app.get("io").to("general").emit("receive_message", savedMessage);
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    res.status(500).json({
      message: "Ошибка при сохранении сообщения",
      error: error.message,
    });
  }
});

export default router;
