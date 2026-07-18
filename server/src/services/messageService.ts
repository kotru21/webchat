import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { toMessageDto } from "../utils/serializers.js";
import { assertCanListDm, dmRoomId } from "./accessControl.js";
import { messageInclude } from "./dbShapes.js";

interface CreateMessageInput {
  senderId: string;
  senderUsername: string;
  content?: string;
  receiverId: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  audioDuration?: number | null;
  roomId?: string;
  isPrivate?: boolean;
}

const MAX_LIMIT = 100;

const clampLimit = (value: number): number => {
  if (!Number.isFinite(value) || value < 1) return 50;
  return Math.min(Math.floor(value), MAX_LIMIT);
};

const getMessageEntity = async (messageId: string) => {
  return prisma.message.findUnique({
    where: { id: messageId },
    include: messageInclude,
  });
};

export const createMessage = async (data: CreateMessageInput) => {
  assertCanListDm(data.senderId, data.receiverId);

  const receiver = await prisma.user.findUnique({
    where: { id: data.receiverId },
    select: { id: true },
  });

  if (!receiver) {
    throw createHttpError(404, "Получатель не найден", "RECEIVER_NOT_FOUND");
  }

  const room = data.roomId ?? dmRoomId(data.senderId, data.receiverId);

  const created = await prisma.message.create({
    data: {
      senderId: data.senderId,
      senderUsername: data.senderUsername,
      content: data.content ?? "",
      receiverId: data.receiverId,
      mediaUrl: data.mediaUrl ?? null,
      mediaType: data.mediaType ?? null,
      audioDuration: data.audioDuration ?? null,
      roomId: room,
      isPrivate: true,
    },
    select: { id: true },
  });

  const entity = await getMessageEntity(created.id);
  if (!entity) {
    throw createHttpError(500, "Ошибка при создании сообщения", "MESSAGE_CREATE_FAILED");
  }

  return toMessageDto(entity);
};

export const listMessages = async ({
  userId,
  receiverId,
  page = 1,
  limit = 50,
}: {
  userId: string;
  receiverId?: string;
  page?: number;
  limit?: number;
}) => {
  if (!receiverId) {
    throw createHttpError(400, "Некорректный собеседник", "INVALID_PEER");
  }

  assertCanListDm(userId, receiverId);

  const take = clampLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const skip = (safePage - 1) * take;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: messageInclude,
  });

  return messages.reverse().map((message) => toMessageDto(message));
};
