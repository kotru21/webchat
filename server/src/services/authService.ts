import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { toOwnUser, toPublicUser } from "../utils/serializers.js";
import {
  createRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
  signAccessToken,
} from "../utils/tokens.js";
import { userOwnSelect, userPublicSelect } from "./dbShapes.js";

interface RegisterUserInput {
  email: string;
  password: string;
  username?: string;
  avatar?: string;
}

interface UpdateProfileInput {
  username?: string;
  description?: string;
  avatar?: string;
  banner?: string;
}

const createFamilyId = (): string => crypto.randomUUID();

const issueTokenPair = async (userId: string, familyId = createFamilyId()) => {
  const token = signAccessToken(userId);
  const refreshToken = createRefreshToken();

  await prisma.refreshSession.create({
    data: {
      userId,
      familyId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { token, refreshToken };
};

const revokeAllSessionsInFamily = async (familyId: string): Promise<void> => {
  await prisma.refreshSession.updateMany({
    where: {
      familyId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const getOwnUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userOwnSelect,
  });

  return user ? toOwnUser(user) : undefined;
};

export const getPublicUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  });

  return user ? toPublicUser(user) : undefined;
};

const SEARCH_USERS_MAX = 20;

/** Escape `%`, `_`, and `\` for SQLite LIKE ... ESCAPE '\'. */
const escapeLikePattern = (value: string): string =>
  value.replace(/([\\%_])/g, "\\$1");

export const searchPublicUsers = async (viewerId: string, q: string) => {
  const query = q.trim();
  if (!query) return [];

  // Prisma `mode: 'insensitive'` is not supported on SQLite; use lower()+LIKE.
  const pattern = `%${escapeLikePattern(query.toLowerCase())}%`;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      username: string;
      avatar: string;
      banner: string;
      description: string;
      createdAt: Date | string;
      updatedAt: Date | string;
    }>
  >(
    Prisma.sql`
      SELECT id, username, avatar, banner, description, createdAt, updatedAt
      FROM "User"
      WHERE id != ${viewerId}
        AND lower(username) LIKE ${pattern} ESCAPE '\\'
      ORDER BY username ASC
      LIMIT ${SEARCH_USERS_MAX}
    `
  );

  return rows.map((row) =>
    toPublicUser({
      id: row.id,
      username: row.username,
      avatar: row.avatar,
      banner: row.banner,
      description: row.description,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
    })
  );
};

/** @deprecated Prefer getOwnUserById / getPublicUserById */
export const getSafeUserById = getOwnUserById;

export const registerUser = async ({
  email,
  password,
  username,
  avatar,
}: RegisterUserInput) => {
  const normalizedEmail = email.trim().toLowerCase();
  const fallbackUsername = normalizedEmail.split("@")[0] || "user";
  const normalizedUsername = (username?.trim() || fallbackUsername).slice(0, 30);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
    select: {
      email: true,
      username: true,
    },
  });

  if (existing) {
    if (existing.email === normalizedEmail) {
      throw createHttpError(400, "Email уже используется", "EMAIL_TAKEN");
    }
    throw createHttpError(400, "Никнейм уже занят", "USERNAME_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      avatar: avatar ?? "",
    },
    select: userOwnSelect,
  });

  return toOwnUser(created);
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      ...userOwnSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    throw createHttpError(400, "Неверный email или пароль", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw createHttpError(400, "Неверный email или пароль", "INVALID_CREDENTIALS");
  }

  const tokens = await issueTokenPair(user.id);

  return {
    user: toOwnUser(user),
    ...tokens,
  };
};

export const refreshUserTokens = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      familyId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!session) {
    throw createHttpError(401, "Недействительный refresh token", "INVALID_REFRESH_TOKEN");
  }

  if (session.revokedAt != null) {
    await revokeAllSessionsInFamily(session.familyId);
    throw createHttpError(
      401,
      "Обнаружено повторное использование refresh token",
      "REFRESH_REUSE_DETECTED"
    );
  }

  if (session.expiresAt <= new Date()) {
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    throw createHttpError(401, "Refresh token истек", "REFRESH_TOKEN_EXPIRED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!user) {
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    throw createHttpError(401, "Пользователь не найден", "USER_NOT_FOUND");
  }

  await prisma.refreshSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(session.userId, session.familyId);
};

export const revokeAllUserSessions = async (userId: string) => {
  await prisma.refreshSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const logoutUser = async (userId: string) => {
  await revokeAllUserSessions(userId);
};

/** Resolve user from refresh cookie and revoke all sessions (access JWT optional). */
export const logoutByRefreshToken = async (refreshToken: string): Promise<boolean> => {
  const tokenHash = hashToken(refreshToken);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });
  if (!session) return false;
  await revokeAllUserSessions(session.userId);
  return true;
};

export const updateUserProfile = async (userId: string, data: UpdateProfileInput) => {
  const updateData: UpdateProfileInput = {};

  if (data.username !== undefined) updateData.username = data.username.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.banner !== undefined) updateData.banner = data.banner;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userOwnSelect,
  });

  return toOwnUser(updated);
};
