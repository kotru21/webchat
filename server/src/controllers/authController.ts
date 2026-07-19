import type { Request, RequestHandler } from "express";
import {
  getOwnUserById,
  getPublicUserById,
  loginUser,
  logoutFamilyByRefreshToken,
  refreshUserTokens,
  registerUser,
  revokeAllSessionsInFamily,
  revokeAllUserSessions,
  searchPublicUsers,
  updateUserProfile,
} from "../services/authService.js";
import {
  revokeAllForUser,
  revokeFamily,
} from "../services/tokenRevocation.js";
import { createHttpError, isHttpError } from "../utils/errors.js";
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from "../middleware/cookies.js";
import { userRoomId } from "../services/accessControl.js";
import { verifyAccessToken } from "../utils/tokens.js";

const profileFilePath = (files: Request["files"], key: "avatar" | "banner") => {
  if (!files || Array.isArray(files)) return undefined;
  const file = files[key]?.[0];
  if (!file) return undefined;

  if (key === "avatar") return `/api/media/avatars/${file.filename}`;
  return `/api/media/covers/${file.filename}`;
};

const disconnectFamilySockets = async (
  req: Request,
  userId: string,
  familyId: string
) => {
  const io = req.app.get("io");
  if (!io || typeof io.in !== "function") return;
  const sockets = await io.in(userRoomId(userId)).fetchSockets();
  for (const socket of sockets) {
    if (socket.data?.sid === familyId) {
      socket.disconnect(true);
    }
  }
};

const disconnectAllUserSockets = (req: Request, userId: string) => {
  const io = req.app.get("io");
  if (!io || typeof io.in !== "function") return;
  io.in(userRoomId(userId)).disconnectSockets(true);
};

export const register: RequestHandler = async (req, res) => {
  const { email, password, username } = req.body;

  const user = await registerUser({
    email,
    password,
    username,
    avatar: req.file ? `/api/media/avatars/${req.file.filename}` : undefined,
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
    // Concurrent tab lost the race — do not clear the winner's rotated cookie.
    if (!isHttpError(error) || error.code !== "REFRESH_CONCURRENT") {
      clearRefreshCookie(res);
    }
    throw error;
  }
};

/**
 * Per-device logout: revoke only the refresh family from the cookie.
 * Access JWT optional — expired Bearer must still clear the cookie via refresh path.
 */
export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  let userId: string | undefined;
  let familyId: string | undefined;

  if (typeof refreshToken === "string" && refreshToken) {
    const result = await logoutFamilyByRefreshToken(refreshToken);
    if (result) {
      userId = result.userId;
      familyId = result.familyId;
      revokeFamily(result.familyId);
    }
  }

  // Bearer fallback (no cookie): revoke only this device's family via sid.
  if (!familyId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const accessToken = authHeader.slice("Bearer ".length).trim();
      if (accessToken) {
        try {
          const payload = verifyAccessToken(accessToken);
          userId = payload.id;
          familyId = payload.sid;
          await revokeAllSessionsInFamily(payload.sid);
          revokeFamily(payload.sid);
        } catch {
          // Best-effort: still clear cookies below.
        }
      }
    }
  }

  if (userId && familyId) {
    await disconnectFamilySockets(req, userId, familyId);
  }

  clearRefreshCookie(res);
  res.json({ message: "Logout successful" });
};

/** Logout everywhere: revoke all refresh families + access JWTs for the user. */
export const logoutAll: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  const userId = req.user.id;
  await revokeAllUserSessions(userId);
  revokeAllForUser(userId);
  disconnectAllUserSockets(req, userId);
  clearRefreshCookie(res);
  res.json({ message: "Logout successful" });
};

export const updateProfile: RequestHandler = async (req, res) => {
  if (!req.user) {
    throw createHttpError(401, "Не авторизован", "UNAUTHORIZED");
  }

  // Orphan uploads on failure are removed by cleanupUploadsOnError (status ≥400).
  const user = await updateUserProfile(req.user.id, {
    username: req.body.username,
    description: req.body.description,
    avatar: profileFilePath(req.files, "avatar"),
    banner: profileFilePath(req.files, "banner"),
  });

  res.json(user);
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
