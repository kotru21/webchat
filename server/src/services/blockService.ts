import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { toPublicUser } from "../utils/serializers.js";
import { userPublicSelect } from "./dbShapes.js";

export const blockUser = async (blockerId: string, blockedId: string) => {
  if (blockerId === blockedId) {
    throw createHttpError(400, "Некорректный собеседник", "INVALID_PEER");
  }

  const peer = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });
  if (!peer) {
    throw createHttpError(404, "Пользователь не найден", "USER_NOT_FOUND");
  }

  await prisma.block.upsert({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
    create: { blockerId, blockedId },
    update: {},
  });
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  await prisma.block.deleteMany({
    where: { blockerId, blockedId },
  });
};

export const listBlockedUsers = async (blockerId: string) => {
  const rows = await prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: "desc" },
    select: {
      blocked: { select: userPublicSelect },
    },
  });
  return rows.map((row) => toPublicUser(row.blocked));
};

export const isBlockedEitherWay = async (
  a: string,
  b: string
): Promise<boolean> => {
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return row != null;
};
