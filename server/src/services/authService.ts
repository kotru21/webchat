import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { createHttpError } from "../utils/errors.js";
import { toSafeUser } from "../utils/serializers.js";
import {
  createRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
  signAccessToken,
} from "../utils/tokens.js";
import { userPublicSelect } from "./dbShapes.js";

type RegisterUserInput = {
  email: string;
  password: string;
  username?: string;
  avatar?: string;
};

type UpdateProfileInput = {
  username?: string;
  description?: string;
  avatar?: string;
  banner?: string;
};

const issueTokenPair = async (userId: string) => {
  const token = signAccessToken(userId);
  const refreshToken = createRefreshToken();

  await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { token, refreshToken };
};

export const getSafeUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userPublicSelect,
  });

  return user ? toSafeUser(user) : undefined;
};

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
    select: userPublicSelect,
  });

  return toSafeUser(created);
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      ...userPublicSelect,
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
    user: toSafeUser(user),
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
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!session || session.revokedAt) {
    throw createHttpError(401, "Недействительный refresh token", "INVALID_REFRESH_TOKEN");
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

  return issueTokenPair(session.userId);
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

export const updateUserProfile = async (userId: string, data: UpdateProfileInput) => {
  const updateData: UpdateProfileInput = {};

  if (data.username !== undefined) updateData.username = data.username.trim();
  if (data.description !== undefined) updateData.description = data.description;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.banner !== undefined) updateData.banner = data.banner;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: userPublicSelect,
  });

  return toSafeUser(updated);
};
