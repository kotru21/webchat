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
      // Для личных сообщений
      io.to(messageData.sender.toString())
        .to(messageData.receiver.toString())
        .emit("receive_private_message", savedMessage);
    } else {
      // Для общего чата
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

export default router;
