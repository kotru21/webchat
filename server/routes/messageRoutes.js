import express from "express";
import { getMessages, saveMessage } from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMessages);

router.post("/", protect, async (req, res) => {
  try {
    console.log("POST /api/messages received");
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const messageData = {
      sender: req.user._id,
      senderUsername: req.user.username || req.user.email,
      content: text,
      roomId: "general",
    };

    const savedMessage = await saveMessage(messageData);

    // Отправляем сообщение через сокет всем клиентам в комнате
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
