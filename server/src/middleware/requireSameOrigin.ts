import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const normalizeOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * CSRF defense-in-depth for cookie-authenticated endpoints (refresh/logout).
 * Primary protections stay SameSite=Lax on the refresh cookie and Bearer-only
 * auth on data mutations; this rejects browser cross-site requests explicitly.
 * Requests without an Origin header (non-browser clients, tests) pass through.
 */
export const requireSameOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin !== "string" || !origin) {
    next();
    return;
  }

  const allowed = normalizeOrigin(env.CLIENT_URL);
  if (allowed && normalizeOrigin(origin) === allowed) {
    next();
    return;
  }

  res.status(403).json({
    message: "Недопустимый источник запроса",
    code: "ORIGIN_FORBIDDEN",
  });
};
