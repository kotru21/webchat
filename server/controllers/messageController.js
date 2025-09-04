import { SOCKET_EVENTS } from "../src/shared/socketEvents.js";
import {
  createMessage,
  listMessages,
  markMessageRead as serviceMarkRead,
  updateMessageContent,
  softDeleteMessage,
  setPinned,
} from "../services/messageService.js";

export const getMessages = async (req, res) => {
  try {
    const { receiverId, page = 1, limit = 50 } = req.query;
    const messages = await listMessages({
      userId: req.user._id,
      receiverId,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const pinMessage = async function (messageId, isPinned, io) {
  const message = await setPinned({ messageId, isPinned });
  if (!message) throw new Error("Сообщение не найдено");
  io.emit(SOCKET_EVENTS.MESSAGE_PINNED, {
    messageId: message._id,
    isPinned: message.isPinned,
  });
  return message;
};

export const saveMessage = async (messageData) => createMessage(messageData);

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await serviceMarkRead({ messageId, userId: req.user._id });
    const io = req.app.get("io");
    const payload = { messageId, readBy: message.readBy };
    if (message.isPrivate) {
      io.to(message.sender.toString())
        .to(message.receiver.toString())
        .emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    } else {
      io.to("general").emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    }
    res.json(message);
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.content !== undefined) updateData.content = req.body.content;
    // media update TODO
    if (req.file) {
      updateData.mediaUrl = `/uploads/media/${req.file.filename}`;
      if (req.file.mimetype.startsWith("image/"))
        updateData.mediaType = "image";
      else if (req.file.mimetype.startsWith("video/"))
        updateData.mediaType = "video";
      else if (req.file.mimetype.startsWith("audio/")) {
        updateData.mediaType = "audio";
        const dur = parseInt(req.body.audioDuration);
        updateData.audioDuration = !isNaN(dur) && dur > 0 ? dur : 1;
      }
    } else if (req.body.removeMedia === "true") {
      updateData.mediaUrl = null;
      updateData.mediaType = null;
      updateData.audioDuration = null;
    }
    const updated = await updateMessageContent({
      messageId: req.params.messageId,
      updateData,
    });
    if (!updated)
      return res
        .status(404)
        .json({ message: "Сообщение не найдено или удалено" });
    const io = req.app.get("io");
    if (updated.isPrivate) {
      io.to(updated.sender.toString())
        .to(updated.receiver.toString())
        .emit(SOCKET_EVENTS.MESSAGE_UPDATED, updated);
    } else {
      io.to("general").emit(SOCKET_EVENTS.MESSAGE_UPDATED, updated);
    }
    res.json(updated);
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const deleted = await softDeleteMessage({
      messageId: req.params.messageId,
    });
    if (!deleted)
      return res.status(404).json({ message: "Сообщение не найдено" });
    const io = req.app.get("io");
    if (deleted.isPrivate) {
      io.to(deleted.sender.toString())
        .to(deleted.receiver.toString())
        .emit(SOCKET_EVENTS.MESSAGE_UPDATED, deleted);
    } else {
      io.to("general").emit(SOCKET_EVENTS.MESSAGE_UPDATED, deleted);
    }
    res.json(deleted);
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: error.message });
  }
};
