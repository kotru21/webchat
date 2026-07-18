import type { RequestHandler } from "express";
import {
  getOwnUserById,
  getPublicUserById,
  loginUser,
  logoutByRefreshToken,
  logoutUser,
  refreshUserTokens,
  registerUser,
  searchPublicUsers,
  updateUserProfile,
} from "../services/authService.js";
import { createHttpError } from "../utils/errors.js";
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from "../middleware/cookies.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { safeUnlinkMediaApiUrl } from "../utils/uploads.js";

const profileFilePath = (files: Express.Request["files"], key: "avatar" | "banner") => {
  if (!files || Array.isArray(files)) return undefined;
  const file = files[key]?.[0];
  if (!file) return undefined;

  if (key === "avatar") return `/api/media/avatars/${file.filename}`;
  return `/api/media/banners/${file.filename}`;
};

export const register: RequestHandler = async (req, res) => {
  const { email, password, username } = req.body;
  const avatarUrl = req.file
    ? `/api/media/avatars/${req.file.filename}`
    : undefined;

  try {
    const user = await registerUser({
      email,
      password,
      username,
      avatar: avatarUrl,
    });

    res.status(201).json({
      message: "Регистрация успешна.",
      id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    // Upload ran before registerUser; drop orphan avatar on duplicate email/username.
    if (avatarUrl) {
      await safeUnlinkMediaApiUrl(process.cwd(), avatarUrl);
    }
    throw error;
  }
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Пожалуйста, заполните все поля", "MISSING_CREDENTIALS");
  }

  const { user, token, refreshToken } = await loginUser(email, password);
  setRefreshCookie(res, refreshToken);

  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    token,
  });
};

export const refreshAccessToken: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken || typeof refreshToken !== "string") {
    clearRefreshCookie(res);
    throw createHttpError(400, "Refresh token обязателен", "REFRESH_TOKEN_REQUIRED");
  }

  try {
    const tokens = await refreshUserTokens(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ token: tokens.token });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
};

/**
 * Logout must succeed when the access JWT is expired but the refresh cookie
 * is still valid — otherwise sessions stay alive and the cookie is not cleared.
 */
export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  let revoked = false;

  if (typeof refreshToken === "string" && refreshToken) {
    revoked = await logoutByRefreshToken(refreshToken);
  }

  if (!revoked) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice("Bearer ".length).trim();
      if (accessToken) {
        try {
          const payload = verifyAccessToken(accessToken);
          await logoutUser(payload.id);
        } catch {
          // Best-effort: still clear cookies below.
        }
      }
    }
  }

  clearRefreshCookie(res);
  res.json({ message: "Logout successful" });
};

export const updateProfile: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const avatar = profileFilePath(req.files, "avatar");
  const banner = profileFilePath(req.files, "banner");

  try {
    const user = await updateUserProfile(req.user.id, {
      username: req.body.username,
      description: req.body.description,
      avatar,
      banner,
    });
    res.json(user);
  } catch (error) {
    // Pipeline already wrote new files; drop them if profile update fails.
    const root = process.cwd();
    if (avatar) await safeUnlinkMediaApiUrl(root, avatar);
    if (banner) await safeUnlinkMediaApiUrl(root, banner);
    throw error;
  }
};

export const searchUsers: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const q = typeof req.query.q === "string" ? req.query.q : "";
  const users = await searchPublicUsers(req.user.id, q);
  res.json(users);
};

export const getUserProfile: RequestHandler = async (req, res) => {
  const userId = req.params.id;
  if (typeof userId !== "string" || !userId) {
    throw createHttpError(400, "Некорректный ID пользователя", "INVALID_USER_ID");
  }

  const user = await getPublicUserById(userId);

  if (!user) {
    throw createHttpError(404, "Пользователь не найден", "USER_NOT_FOUND");
  }

  res.json(user);
};

export const getMe: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const user = await getOwnUserById(req.user.id);
  if (!user) {
    throw createHttpError(404, "Пользователь не найден", "USER_NOT_FOUND");
  }

  res.json(user);
};
