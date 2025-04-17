import Message from "../Models/messageModel.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMessages = async (req, res) => {
  try {
    const { receiverId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = receiverId
      ? {
          $or: [
            { sender: req.user._id, receiver: receiverId },
            { sender: receiverId, receiver: req.user._id },
          ],
        }
      : { isPrivate: false };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "username email avatar")
      .populate("readBy", "username email")
      .lean();

    // Manually populate receiver if it exists
    await Message.populate(messages, {
      path: "receiver",
      select: "username email avatar",
    });

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const pinMessage = async function (messageId, isPinned, io) {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Сообщение не найдено");
    }
    message.isPinned = isPinned;
    await message.save();
    // Отправляем событие через Socket.IO
    io.emit("message_pinned", {
      messageId: message._id,
      isPinned: message.isPinned,
    });
    return message;
  } catch (error) {
    console.error("Ошибка в pinMessage:", error);
    throw error;
  }
};

export const saveMessage = async (messageData) => {
  try {
    const message = new Message(messageData);
    await message.save();

    return await Message.findById(message._id)
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .lean();
  } catch (error) {
    console.error("Error saving message:", error);
    throw error;
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { readBy: userId },
      },
      { new: true }
    )
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .populate("readBy", "username email");

    const io = req.app.get("io");
    if (message.isPrivate) {
      io.to(message.sender.toString())
        .to(message.receiver.toString())
        .emit("message_read", { messageId, readBy: message.readBy });
    } else {
      io.to("general").emit("message_read", {
        messageId,
        readBy: message.readBy,
      });
    }

    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено" });
    }

    // Проверяем права на редактирование
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Нет прав на редактирование" });
    }

    const updateData = {};

    // Обновляем текст
    if (req.body.content !== undefined) {
      updateData.content = req.body.content;
    }

    // Обработка медиафайла
    if (req.file) {
      // Удаляем старый файл, если он есть
      if (message.mediaUrl) {
        const oldFilePath = path.join(__dirname, "..", message.mediaUrl);
        await fs.unlink(oldFilePath).catch(console.error);
      }
      updateData.mediaUrl = `/uploads/media/${req.file.filename}`;
      updateData.mediaType = req.file.mimetype.startsWith("image/")
        ? "image"
        : "video";
    } else if (req.body.removeMedia === "true") {
      // Удаляем медиафайл, если получен флаг removeMedia
      if (message.mediaUrl) {
        const filePath = path.join(__dirname, "..", message.mediaUrl);
        await fs.unlink(filePath).catch(console.error);
      }
      updateData.mediaUrl = null;
      updateData.mediaType = null;
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        ...updateData,
        isEdited: true,
      },
      { new: true }
    )
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .populate("readBy", "username email");

    // Оповещаем через Socket.IO
    const io = req.app.get("io");
    if (updatedMessage.isPrivate) {
      io.to(updatedMessage.sender.toString())
        .to(updatedMessage.receiver.toString())
        .emit("message_updated", updatedMessage);
    } else {
      io.to("general").emit("message_updated", updatedMessage);
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Сообщение не найдено" });
    }

    // Проверяем права на удаление
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Нет прав на удаление" });
    }

    // Вместо полного удаления, помечаем сообщение как удаленное
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        isDeleted: true,
        content: "Сообщение удалено",
        mediaUrl: null,
        mediaType: null,
      },
      { new: true }
    )
      .populate("sender", "username email avatar")
      .populate("receiver", "username email avatar")
      .populate("readBy", "username email");

    // Удаляем медиафайл, если он есть
    if (message.mediaUrl) {
      const filePath = path.join(__dirname, "..", message.mediaUrl);
      await fs.unlink(filePath).catch(console.error);
    }

    // Оповещаем через Socket.IO
    const io = req.app.get("io");
    if (message.isPrivate) {
      io.to(message.sender.toString())
        .to(message.receiver.toString())
        .emit("message_updated", updatedMessage);
    } else {
      io.to("general").emit("message_updated", updatedMessage);
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: error.message });
  }
};
