import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "refreshToken";
/** Non-HttpOnly flag so the SPA can skip refresh when no session exists. */
export const REFRESH_SESSION_FLAG = "hasRefreshSession";

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production" || env.COOKIE_SECURE === true,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

const sessionFlagOptions = (): CookieOptions => ({
  httpOnly: false,
  secure: env.NODE_ENV === "production" || env.COOKIE_SECURE === true,
  sameSite: "lax",
  path: "/",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
});

export const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
  res.cookie(REFRESH_SESSION_FLAG, "1", sessionFlagOptions());
};

export const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(),
    maxAge: 0,
  });
  res.clearCookie(REFRESH_SESSION_FLAG, {
    ...sessionFlagOptions(),
    maxAge: 0,
  });
};
