import express from "express";
import {
  getMessages,
  saveMessage,
  markAsRead,
  updateMessage,
  deleteMessage,
  pinMessage,
} from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";
import { upload } from "../config/multer.js";
import { messageLimiter } from "../middleware/rateLimiter.js";
import { validateMessage } from "../middleware/validator.js";

const router = express.Router();

// Маршрут получения сообщений без лимитера
router.get("/", protect, getMessages);

// Применяем лимитер только к отправке/редактированию сообщений
router.post(
  "/",
  protect,
  messageLimiter,
  validateMessage,
  upload.single("media"),
  async (req, res) => {
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
      };

      if (req.file) {
        messageData.mediaUrl = `/uploads/media/${req.file.filename}`;
        messageData.mediaType = req.file.mimetype.startsWith("image/")
          ? "image"
          : "video";
      }

      const savedMessage = await saveMessage(messageData);

      // Отправляем сообщение через Socket.IO только один раз
      const io = req.app.get("io");

      if (messageData.isPrivate) {
        io.to(messageData.sender.toString())
          .to(messageData.receiver.toString())
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
  }
);

router.put(
  "/:messageId",
  protect,
  messageLimiter,
  validateMessage,
  upload.single("media"),
  updateMessage
);

router.put("/:id/pin", protect, async (req, res) => {
  try {
    const io = req.app.get("io");
    const message = await pinMessage(req.params.id, req.body.isPinned, io);
    res.json(message);
  } catch (error) {
    if (error.message === "Сообщение не найдено") {
      return res.status(404).json({ message: error.message });
    }
    console.error("Ошибка при закреплении сообщения:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.delete("/:messageId", protect, deleteMessage);
router.post("/:messageId/read", protect, markAsRead);

export default router;
