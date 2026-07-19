import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { env } from "../config/env.js";
import {
  createRefreshToken,
  hashToken,
  parseDurationMs,
  refreshTokenExpiryDate,
  signAccessToken,
  verifyAccessToken,
} from "./tokens.js";

describe("token utils", () => {
  it("creates refresh token with strong entropy-like length", () => {
    const token = createRefreshToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBe(128);
  });

  it("hashes refresh token deterministically", () => {
    const token = "sample-token";
    const first = hashToken(token);
    const second = hashToken(token);

    expect(first).toBe(second);
    expect(first.length).toBe(64);
  });

  it("signs and verifies access token with sid", () => {
    const userId = "user-123";
    const sid = "family-abc";
    const token = signAccessToken(userId, sid);
    const payload = verifyAccessToken(token);

    expect(payload.id).toBe(userId);
    expect(payload.sid).toBe(sid);
  });

  it("rejects access tokens without sid", () => {
    const token = jwt.sign({ id: "user-123" }, env.JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    });
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("parses duration strings", () => {
    expect(parseDurationMs("15m")).toBe(15 * 60 * 1000);
    expect(parseDurationMs("1h")).toBe(3_600_000);
    expect(parseDurationMs("30s")).toBe(30_000);
    expect(parseDurationMs("bogus")).toBe(15 * 60 * 1000);
  });

  it("computes refresh token expiry in the future", () => {
    const expiresAt = refreshTokenExpiryDate();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
