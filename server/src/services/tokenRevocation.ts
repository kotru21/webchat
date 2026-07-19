import type { JwtPayload } from "../types/auth.js";
import { parseDurationMs } from "../utils/tokens.js";
import { env } from "../config/env.js";

/** Access TTL + skew — entries older than this are dead anyway. */
const REVOCATION_TTL_MS = parseDurationMs(env.ACCESS_TOKEN_TTL) + 60_000;

interface FamilyRevocation {
  revokedAtMs: number;
}

interface UserCutoff {
  /**
   * Unix seconds — access tokens with `iat <= cutoffIat` are revoked.
   * Same-second login after logout-all can also match (accepted lab edge case).
   */
  cutoffIat: number;
  recordedAtMs: number;
}

const revokedFamilies = new Map<string, FamilyRevocation>();
const userCutoffs = new Map<string, UserCutoff>();

const sweepExpired = (): void => {
  const now = Date.now();
  for (const [familyId, entry] of revokedFamilies) {
    if (now - entry.revokedAtMs > REVOCATION_TTL_MS) {
      revokedFamilies.delete(familyId);
    }
  }
  for (const [userId, entry] of userCutoffs) {
    if (now - entry.recordedAtMs > REVOCATION_TTL_MS) {
      userCutoffs.delete(userId);
    }
  }
};

// Periodic sweep must not keep the process alive (vitest hang).
setInterval(sweepExpired, 60_000).unref();

export const revokeFamily = (familyId: string): void => {
  revokedFamilies.set(familyId, { revokedAtMs: Date.now() });
};

export const revokeAllForUser = (userId: string): void => {
  userCutoffs.set(userId, {
    cutoffIat: Math.floor(Date.now() / 1000),
    recordedAtMs: Date.now(),
  });
};

export const isAccessTokenRevoked = (payload: JwtPayload): boolean => {
  sweepExpired();

  const family = revokedFamilies.get(payload.sid);
  if (family) return true;

  const cutoff = userCutoffs.get(payload.id);
  if (
    cutoff != null &&
    typeof payload.iat === "number" &&
    payload.iat <= cutoff.cutoffIat
  ) {
    return true;
  }

  return false;
};

/** Test-only: clear in-memory state between suites if needed. */
export const _resetRevocationStoreForTests = (): void => {
  revokedFamilies.clear();
  userCutoffs.clear();
};
