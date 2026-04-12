import { describe, expect, it } from "vitest";
import {
  createRefreshToken,
  hashToken,
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

  it("signs and verifies access token", () => {
    const userId = "user-123";
    const token = signAccessToken(userId);
    const payload = verifyAccessToken(token);

    expect(payload.id).toBe(userId);
  });

  it("computes refresh token expiry in the future", () => {
    const expiresAt = refreshTokenExpiryDate();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
