import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/auth.js";

const DURATION_RE = /^(\d+)\s*([smhd])$/i;

/** Parse values like `"15m"`, `"1h"` into milliseconds. Fallback 15 minutes. */
export const parseDurationMs = (value: string | undefined): number => {
  if (!value) return 15 * 60 * 1000;
  const match = DURATION_RE.exec(value.trim());
  if (!match?.[1] || !match[2]) return 15 * 60 * 1000;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (multipliers[unit] ?? 60_000);
};

export const signAccessToken = (userId: string, sid: string): string => {
  const expiresIn = env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"];
  return jwt.sign({ id: userId, sid }, env.JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload;

  if (typeof payload.id !== "string" || !payload.id) {
    throw new jwt.JsonWebTokenError("missing id claim");
  }
  if (typeof payload.sid !== "string" || !payload.sid) {
    throw new jwt.JsonWebTokenError("missing sid claim");
  }

  return payload;
};

export const createRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const refreshTokenExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
};
