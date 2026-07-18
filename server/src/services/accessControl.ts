import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";

export const dmRoomId = (userA: string, userB: string): string => {
  const [minId, maxId] = [userA, userB].sort();
  return `dm:${minId}:${maxId}`;
};

export const userRoomId = (userId: string): string => `user:${userId}`;

export const isAllowedSocketRoom = (userId: string, roomId: string): boolean => {
  if (roomId === userRoomId(userId)) return true;
  const match = /^dm:([^:]+):([^:]+)$/.exec(roomId);
  if (!match) return false;
  const a = match[1];
  const b = match[2];
  if (!a || !b) return false;
  if (a !== userId && b !== userId) return false;
  // Reject non-canonical order (e.g. dm:b:a) so clients cannot join shadow rooms.
  return roomId === dmRoomId(a, b);
};

export const assertCanAccessDm = (
  userId: string,
  participantA: string,
  participantB: string
): void => {
  if (userId !== participantA && userId !== participantB) {
    throw createHttpError(403, "Нет доступа к диалогу", "DM_FORBIDDEN");
  }
};

export const assertCanListDm = (userId: string, peerId: string): void => {
  if (!peerId || peerId === userId) {
    throw createHttpError(400, "Некорректный собеседник", "INVALID_PEER");
  }
  assertCanAccessDm(userId, userId, peerId);
};

/** Authorize GET of a message attachment (`/api/media/media/...`) via owning DM. */
export const assertCanAccessMediaAttachment = async (
  userId: string,
  mediaUrl: string
): Promise<void> => {
  const message = await prisma.message.findFirst({
    where: { mediaUrl },
    select: {
      senderId: true,
      receiverId: true,
      isPrivate: true,
    },
  });

  if (!message) {
    throw createHttpError(404, "Файл не найден", "MEDIA_NOT_FOUND");
  }

  if (!message.isPrivate || !message.receiverId) {
    throw createHttpError(403, "Нет доступа к медиа", "MEDIA_FORBIDDEN");
  }

  assertCanAccessDm(userId, message.senderId, message.receiverId);
};
