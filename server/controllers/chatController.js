import mongoose from "mongoose";
import Message from "../Models/messageModel.js";
import User from "../Models/userModel.js";

// Получение списка чатов пользователя
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Получение чатов для пользователя:", userId);

    // Находим все сообщения, где пользователь является отправителем или получателем
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "username email avatar status")
      .populate("receiver", "username email avatar status");

    // Создаем Map для хранения уникальных чатов
    const uniqueChats = new Map();

    for (const message of messages) {
      // Пропускаем групповые сообщения (если в receiver нет данных)
      if (!message.receiver || !message.receiver._id) continue;

      // Определяем, кто является другим участником чата
      const otherUserId =
        message.sender._id.toString() === userId.toString()
          ? message.receiver._id.toString()
          : message.sender._id.toString();

      // Пропускаем сообщения, отправленные самому себе или в общий чат
      if (otherUserId === userId.toString()) continue;

      // Если этот чат еще не добавлен, добавляем его
      if (!uniqueChats.has(otherUserId)) {
        const otherUser =
          message.sender._id.toString() === userId.toString()
            ? message.receiver
            : message.sender;

        // Считаем непрочитанные сообщения
        const unreadCount = messages.filter(
          (msg) =>
            msg.sender._id.toString() === otherUserId &&
            !msg.readBy?.some(
              (reader) => reader.toString() === userId.toString()
            )
        ).length;

        uniqueChats.set(otherUserId, {
          user: {
            _id: otherUser._id,
            username: otherUser.username,
            email: otherUser.email,
            avatar: otherUser.avatar,
            status: otherUser.status || "offline",
          },
          lastMessage: message,
          unreadCount,
        });
      }
    }

    // Преобразуем Map в массив
    const chats = Array.from(uniqueChats.values());

    console.log("Получено чатов:", chats.length);
    res.json(chats);
  } catch (error) {
    console.error("Ошибка при получении списка чатов:", error);
    res.status(500).json({ message: "Ошибка при получении списка чатов" });
  }
};
