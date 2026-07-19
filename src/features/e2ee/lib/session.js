import {
  exportPublicJwk,
  fingerprint,
  generateIdentityKeyPair,
} from "./crypto.js";
import { loadIdentity, saveIdentity } from "./keyStore.js";
import { putOwnPublicKey } from "../api/e2eeApi.js";

/** @type {string | null} */
let cachedOwnerId = null;
/** @type {CryptoKeyPair | null} */
let cachedPair = null;
/** @type {string | null} */
let cachedFingerprint = null;
/** @type {Promise<CryptoKeyPair> | null} */
let enrollPromise = null;
/** @type {string | null} */
let enrollOwnerId = null;

/**
 * Load or create identity for `ownerUserId`, publish public key.
 * Idempotent per (page session, user). Never reuses another account's key.
 * @param {string} ownerUserId
 * @returns {Promise<CryptoKeyPair>}
 */
export async function ensureIdentity(ownerUserId) {
  if (!ownerUserId) {
    throw new Error("IDENTITY_OWNER_REQUIRED");
  }

  if (cachedPair && cachedOwnerId === ownerUserId) {
    return cachedPair;
  }
  if (enrollPromise && enrollOwnerId === ownerUserId) {
    return enrollPromise;
  }

  // Different account (or first load after logout) — drop in-memory cache.
  if (cachedOwnerId !== ownerUserId) {
    cachedPair = null;
    cachedFingerprint = null;
  }

  enrollOwnerId = ownerUserId;
  enrollPromise = (async () => {
    let pair = await loadIdentity(ownerUserId);
    if (!pair) {
      pair = await generateIdentityKeyPair();
      await saveIdentity(ownerUserId, pair);
    }
    const jwk = await exportPublicJwk(pair);
    await putOwnPublicKey({
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
    });
    cachedOwnerId = ownerUserId;
    cachedPair = pair;
    cachedFingerprint = await fingerprint(pair.publicKey);
    return pair;
  })();

  try {
    return await enrollPromise;
  } finally {
    enrollPromise = null;
    enrollOwnerId = null;
  }
}

/**
 * @param {string} ownerUserId
 */
export async function getMyFingerprint(ownerUserId) {
  if (cachedFingerprint && cachedOwnerId === ownerUserId) {
    return cachedFingerprint;
  }
  const pair = await ensureIdentity(ownerUserId);
  cachedFingerprint = await fingerprint(pair.publicKey);
  return cachedFingerprint;
}

/**
 * @param {string | null | undefined} [ownerUserId]
 */
export function getCachedIdentity(ownerUserId) {
  if (ownerUserId && cachedOwnerId !== ownerUserId) return null;
  return cachedPair;
}

/** Test / logout helper */
export function resetIdentityCache() {
  cachedOwnerId = null;
  cachedPair = null;
  cachedFingerprint = null;
  enrollPromise = null;
  enrollOwnerId = null;
}
