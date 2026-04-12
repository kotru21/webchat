import type { RequestHandler } from "express";
import {
  getSafeUserById,
  loginUser,
  logoutUser,
  refreshUserTokens,
  registerUser,
  updateUserProfile,
} from "../services/authService.js";
import { createHttpError } from "../utils/errors.js";

const profileFilePath = (files: Express.Request["files"], key: "avatar" | "banner") => {
  if (!files || Array.isArray(files)) return undefined;
  const file = files[key]?.[0];
  if (!file) return undefined;

  if (key === "avatar") return `/uploads/avatars/${file.filename}`;
  return `/uploads/banners/${file.filename}`;
};

export const register: RequestHandler = async (req, res) => {
  const { email, password, username } = req.body;

  const user = await registerUser({
    email,
    password,
    username,
    avatar: req.file ? `/uploads/avatars/${req.file.filename}` : undefined,
  });

  res.status(201).json({
    message: "Регистрация успешна.",
    id: user._id,
    username: user.username,
    email: user.email,
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Пожалуйста, заполните все поля", "MISSING_CREDENTIALS");
  }

  const { user, token, refreshToken } = await loginUser(email, password);

  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    token,
    refreshToken,
  });
};

export const refreshAccessToken: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    throw createHttpError(400, "Refresh token обязателен", "REFRESH_TOKEN_REQUIRED");
  }

  const tokens = await refreshUserTokens(refreshToken);
  res.json(tokens);
};

export const logout: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  await logoutUser(req.user.id);

  res.json({ message: "Logout successful" });
};

export const updateProfile: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const user = await updateUserProfile(req.user.id, {
    username: req.body.username,
    description: req.body.description,
    avatar: profileFilePath(req.files, "avatar"),
    banner: profileFilePath(req.files, "banner"),
  });

  res.json(user);
};

export const getUserProfile: RequestHandler = async (req, res) => {
  const userId = req.params.id;
  if (typeof userId !== "string" || !userId) {
    throw createHttpError(400, "Некорректный ID пользователя", "INVALID_USER_ID");
  }

  const user = await getSafeUserById(userId);

  if (!user) {
    throw createHttpError(404, "Пользователь не найден", "USER_NOT_FOUND");
  }

  res.json(user);
};

export const getMe: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const user = await getSafeUserById(req.user.id);
  if (!user) {
    throw createHttpError(404, "Пользователь не найден", "USER_NOT_FOUND");
  }

  res.json(user);
};
