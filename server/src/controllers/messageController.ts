import type { Request, RequestHandler } from "express";
import { FILE_LIMITS } from "../constants/fileConstants.js";
import { SOCKET_EVENTS } from "../constants/socketEvents.js";
import { dmRoomId, userRoomId } from "../services/accessControl.js";
import { createMessage, listMessages } from "../services/messageService.js";
import { createHttpError } from "../utils/errors.js";

const parseAudioDuration = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(Math.floor(parsed), FILE_LIMITS.VOICE_MESSAGE_MAX_DURATION);
};

const getMessageMediaFromUpload = (req: Request) => {
  if (!req.file) return undefined;

  const mediaUrl = `/api/media/media/${req.file.filename}`;
  let mediaType: string | null = null;

  // Derive type from validated MIME only — ignore client mediaType override.
  if (req.file.mimetype.startsWith("image/")) {
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
};

const emitMessage = (
  req: Request,
  message: {
    _id: string;
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

  if (!senderId || !receiverId) return;

  io.to([dmRoomId(senderId, receiverId), userRoomId(receiverId)]).emit(
    SOCKET_EVENTS.MESSAGE_NEW,
    message
  );
};

export const getMessages: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Пользователь не авторизован", "UNAUTHORIZED");
  }

  const page = Number.parseInt(String(req.query.page ?? "1"), 10);
  const limit = Number.parseInt(String(req.query.limit ?? "50"), 10);
  const receiverId =
    typeof req.query.receiverId === "string" ? req.query.receiverId : undefined;

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
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const receiverId =
    typeof req.body.receiverId === "string" ? req.body.receiverId : undefined;
  if (!receiverId) {
    throw createHttpError(400, "Некорректный собеседник", "INVALID_PEER");
  }

  const content =
    typeof req.body.text === "string"
      ? req.body.text
      : typeof req.body.content === "string"
        ? req.body.content
        : "";

  // Client-supplied mediaUrl is ignored; only uploaded files are accepted.
  const media = getMessageMediaFromUpload(req);

  if (!content.trim() && !media?.mediaUrl) {
    throw createHttpError(400, "Сообщение пустое", "EMPTY_MESSAGE");
  }

  const savedMessage = await createMessage({
    senderId: req.user.id,
    senderUsername: req.user.username?.trim() || "user",
    content,
    receiverId,
    mediaUrl: media?.mediaUrl ?? null,
    mediaType: media?.mediaType ?? null,
    audioDuration: media?.audioDuration ?? null,
  });

  emitMessage(req, savedMessage);
  res.status(201).json(savedMessage);
};
