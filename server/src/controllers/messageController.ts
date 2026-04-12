import type { Request, RequestHandler } from "express";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import {
  createMessage,
  listMessages,
  markMessageRead,
  setPinned,
  softDeleteMessage,
  updateMessageContent,
} from "../services/messageService.js";
import { createHttpError } from "../utils/errors.js";

const parseAudioDuration = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

const getRequiredParam = (value: string | string[] | undefined, key: string): string => {
  if (typeof value !== "string" || !value) {
    throw createHttpError(400, `Некорректный параметр: ${key}`, "INVALID_ROUTE_PARAM");
  }

  return value;
};

const getMessageMediaUpdate = (req: Request) => {
  if (req.file) {
    const mediaUrl = `/uploads/media/${req.file.filename}`;
    let mediaType: string | null = null;

    if (req.body.mediaType === "audio") {
      mediaType = "audio";
    } else if (req.file.mimetype.startsWith("image/")) {
      mediaType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      mediaType = "video";
    } else if (req.file.mimetype.startsWith("audio/")) {
      mediaType = "audio";
    }

    return {
      mediaUrl,
      mediaType,
      audioDuration:
        mediaType === "audio" ? parseAudioDuration(req.body.audioDuration) : null,
    };
  }

  if (req.body.removeMedia === "true") {
    return {
      mediaUrl: null,
      mediaType: null,
      audioDuration: null,
    };
  }

  return undefined;
};

const emitMessage = (
  req: Request,
  eventName: string,
  message: {
    _id: string;
    isPrivate?: boolean;
    sender?: { _id: string } | string;
    receiver?: { _id: string } | string | null;
  }
) => {
  const io = req.app.get("io");
  if (!io) return;

  const senderId =
    typeof message.sender === "object" && message.sender
      ? message.sender._id
      : message.sender;

  const receiverId =
    typeof message.receiver === "object" && message.receiver
      ? message.receiver._id
      : message.receiver;

  if (message.isPrivate && senderId && receiverId) {
    io.to(senderId).to(receiverId).emit(eventName, message);
    return;
  }

  io.to("general").emit(eventName, message);
};

export const getMessages: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Пользователь не авторизован", "UNAUTHORIZED");
  }

  const page = Number.parseInt(String(req.query.page ?? "1"), 10);
  const limit = Number.parseInt(String(req.query.limit ?? "50"), 10);
  const receiverId = typeof req.query.receiverId === "string" ? req.query.receiverId : undefined;

  const messages = await listMessages({
    userId: req.user.id,
    receiverId,
    page,
    limit,
  });

  res.json(messages);
};

export const createMessageHandler: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Пользователь не авторизован", "UNAUTHORIZED");
  }

  const receiverId = typeof req.body.receiverId === "string" ? req.body.receiverId : undefined;
  const content =
    typeof req.body.text === "string"
      ? req.body.text
      : typeof req.body.content === "string"
      ? req.body.content
      : "";

  const media = getMessageMediaUpdate(req);

  if (!content.trim() && !media?.mediaUrl) {
    throw createHttpError(400, "Сообщение пустое", "EMPTY_MESSAGE");
  }

  const savedMessage = await createMessage({
    senderId: req.user.id,
    senderUsername: req.user.username || req.user.email,
    content,
    receiverId: receiverId ?? null,
    isPrivate: Boolean(receiverId),
    mediaUrl: media?.mediaUrl ?? null,
    mediaType: media?.mediaType ?? null,
    audioDuration: media?.audioDuration ?? null,
  });

  emitMessage(req, SOCKET_EVENTS.MESSAGE_NEW, savedMessage);
  res.status(201).json(savedMessage);
};

export const markAsRead: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Пользователь не авторизован", "UNAUTHORIZED");
  }

  const messageId = getRequiredParam(req.params.messageId, "messageId");

  const message = await markMessageRead({
    messageId,
    userId: req.user.id,
  });

  const io = req.app.get("io");
  if (io) {
    const payload = { messageId: message._id, readBy: message.readBy };
    if (message.isPrivate && message.sender && message.receiver) {
      const senderId = message.sender._id;
      const receiverId = message.receiver._id;
      io.to(senderId).to(receiverId).emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    } else {
      io.to("general").emit(SOCKET_EVENTS.MESSAGE_READ, payload);
    }
  }

  res.json(message);
};

export const updateMessage: RequestHandler = async (req, res) => {
  const messageId = getRequiredParam(req.params.messageId, "messageId");

  const updateData: {
    content?: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    audioDuration?: number | null;
  } = {};
  if (typeof req.body.content === "string") updateData.content = req.body.content;
  if (typeof req.body.text === "string") updateData.content = req.body.text;

  const media = getMessageMediaUpdate(req);
  if (media) {
    updateData.mediaUrl = media.mediaUrl;
    updateData.mediaType = media.mediaType;
    updateData.audioDuration = media.audioDuration;
  }

  const updated = await updateMessageContent({
    messageId,
    updateData,
  });

  if (!updated) {
    throw createHttpError(404, "Сообщение не найдено или удалено", "MESSAGE_NOT_FOUND");
  }

  emitMessage(req, SOCKET_EVENTS.MESSAGE_UPDATED, updated);
  res.json(updated);
};

export const deleteMessage: RequestHandler = async (req, res) => {
  const messageId = getRequiredParam(req.params.messageId, "messageId");

  const deleted = await softDeleteMessage({
    messageId,
  });

  if (!deleted) {
    throw createHttpError(404, "Сообщение не найдено", "MESSAGE_NOT_FOUND");
  }

  emitMessage(req, SOCKET_EVENTS.MESSAGE_UPDATED, deleted);
  res.json(deleted);
};

export const pinMessage: RequestHandler = async (req, res) => {
  const messageId = getRequiredParam(req.params.messageId, "messageId");
  const pinned = await setPinned({
    messageId,
    isPinned: Boolean(req.body.isPinned),
  });

  const io = req.app.get("io");
  if (io) {
    io.emit(SOCKET_EVENTS.MESSAGE_PINNED, {
      messageId: pinned.id,
      isPinned: pinned.isPinned,
    });
  }

  res.json({
    _id: pinned.id,
    isPinned: pinned.isPinned,
  });
};
