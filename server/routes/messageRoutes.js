import express from "express";
import {
  getMessages,
  saveMessage,
  markAsRead,
  updateMessage,
  deleteMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/mediaUpload.js";

const router = express.Router();

router.get("/", protect, getMessages);

router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
    }

    const messageData = {
      sender: req.user._id,
      senderUsername: req.user.username || req.user.email,
      content: req.body.text || "",
      receiver: req.body.receiverId || null,
      isPrivate: !!req.body.receiverId,
      roomId: req.body.receiverId || "general",
    };

    if (req.file) {
      messageData.mediaUrl = `/uploads/media/${req.file.filename}`;
      messageData.mediaType = req.file.mimetype.startsWith("image/")
        ? "image"
        : "video";
    }

    const savedMessage = await saveMessage(messageData);

    // Отправляем сообщение через Socket.IO
    const io = req.app.get("io");
    if (messageData.isPrivate) {
      io.to(messageData.sender.toString())
        .to(messageData.receiver)
        .emit("receive_private_message", savedMessage);
    } else {
      io.to("general").emit("receive_message", savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error in POST /api/messages:", error);
    res.status(500).json({
      message: "Ошибка при сохранении сообщения",
      error: error.message,
    });
  }
});

router.post("/:messageId/read", protect, markAsRead);

// Маршруты для редактирования и удаления
router.put("/:messageId", protect, upload.single("media"), updateMessage);
router.delete("/:messageId", protect, deleteMessage);

export default router;
