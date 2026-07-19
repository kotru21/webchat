/** In-memory plaintext cache (never persisted). Keyed by message _id. */

const cache = new Map();

/** @param {string} messageId @param {string} plaintext */
export function cachePlaintext(messageId, plaintext) {
  if (messageId && typeof plaintext === "string") {
    cache.set(messageId, plaintext);
  }
}

/** @param {string} messageId */
export function getCachedPlaintext(messageId) {
  return cache.get(messageId) ?? null;
}

/** @param {string} fromId @param {string} toId */
export function moveCachedPlaintext(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const value = cache.get(fromId);
  if (typeof value === "string") {
    cache.set(toId, value);
    cache.delete(fromId);
  }
}
