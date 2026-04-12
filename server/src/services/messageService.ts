import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { toMessageDto } from "../utils/serializers.js";
import { safeUnlinkFromServerRoot } from "../utils/uploads.js";
import { messageInclude } from "./dbShapes.js";

type CreateMessageInput = {
  senderId: string;
  senderUsername: string;
  content?: string;
  receiverId?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  audioDuration?: number | null;
  roomId?: string;
  isPrivate: boolean;
};

type UpdateMessageInput = {
  content?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  audioDuration?: number | null;
};

const MAX_LIMIT = 100;
const serverRoot = process.cwd();

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
  if (data.receiverId) {
    const receiver = await prisma.user.findUnique({
      where: { id: data.receiverId },
      select: { id: true },
    });

    if (!receiver) {
      throw createHttpError(404, "Получатель не найден", "RECEIVER_NOT_FOUND");
    }
  }

  const created = await prisma.message.create({
    data: {
      senderId: data.senderId,
      senderUsername: data.senderUsername,
      content: data.content ?? "",
      receiverId: data.receiverId ?? null,
      mediaUrl: data.mediaUrl ?? null,
      mediaType: data.mediaType ?? null,
      audioDuration: data.audioDuration ?? null,
      roomId: data.roomId ?? "general",
      isPrivate: data.isPrivate,
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
  const take = clampLimit(limit);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const skip = (safePage - 1) * take;

  const where = receiverId
    ? {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      }
    : { isPrivate: false };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: messageInclude,
  });

  return messages.reverse().map((message) => toMessageDto(message));
};

export const markMessageRead = async ({
  messageId,
  userId,
}: {
  messageId: string;
  userId: string;
}) => {
  const exists = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true },
  });

  if (!exists) {
    throw createHttpError(404, "Сообщение не найдено", "MESSAGE_NOT_FOUND");
  }

  await prisma.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      messageId,
      userId,
    },
  });

  const updated = await getMessageEntity(messageId);
  if (!updated) {
    throw createHttpError(500, "Ошибка обновления статуса чтения", "MESSAGE_READ_UPDATE_FAILED");
  }

  return toMessageDto(updated);
};

export const updateMessageContent = async ({
  messageId,
  updateData,
}: {
  messageId: string;
  updateData: UpdateMessageInput;
}) => {
  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, isDeleted: true },
  });

  if (!existing || existing.isDeleted) return undefined;

  await prisma.message.update({
    where: { id: messageId },
    data: {
      ...updateData,
      isEdited: true,
    },
    select: { id: true },
  });

  const updated = await getMessageEntity(messageId);
  if (!updated) {
    throw createHttpError(500, "Ошибка обновления сообщения", "MESSAGE_UPDATE_FAILED");
  }

  return toMessageDto(updated);
};

export const softDeleteMessage = async ({
  messageId,
}: {
  messageId: string;
}) => {
  const existing = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, mediaUrl: true },
  });

  if (!existing) return undefined;

  await safeUnlinkFromServerRoot(serverRoot, existing.mediaUrl);

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: "Сообщение удалено",
      mediaUrl: null,
      mediaType: null,
      audioDuration: null,
      isEdited: true,
    },
  });

  const deleted = await getMessageEntity(messageId);
  if (!deleted) {
    throw createHttpError(500, "Ошибка удаления сообщения", "MESSAGE_DELETE_FAILED");
  }

  return toMessageDto(deleted);
};

export const setPinned = async ({
  messageId,
  isPinned,
}: {
  messageId: string;
  isPinned: boolean;
}) => {
  return prisma.message.update({
    where: { id: messageId },
    data: {
      isPinned: Boolean(isPinned),
    },
    select: {
      id: true,
      isPinned: true,
      isPrivate: true,
      senderId: true,
      receiverId: true,
    },
  });
};
