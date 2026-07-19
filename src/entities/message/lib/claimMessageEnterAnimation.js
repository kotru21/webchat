/** Message ids that already played enter animation (virtual list safe). */
const claimedIds = new Set();
const MAX_CLAIMED = 400;
const FRESH_MS = 2500;

function pruneOldestClaim() {
  if (claimedIds.size <= MAX_CLAIMED) return;
  const oldest = claimedIds.values().next().value;
  if (oldest != null) claimedIds.delete(oldest);
}

/**
 * Returns true once per message id when the bubble is fresh enough to animate.
 * Prevents re-animating rows recycled by react-window.
 */
export function claimMessageEnterAnimation(messageId, { optimistic, createdAt }) {
  if (messageId == null || messageId === "") return false;
  const id = String(messageId);
  if (claimedIds.has(id)) return false;

  const isFreshOptimistic = Boolean(optimistic);
  const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : Infinity;
  const isFreshIncoming = Number.isFinite(ageMs) && ageMs >= 0 && ageMs < FRESH_MS;

  if (!isFreshOptimistic && !isFreshIncoming) return false;

  claimedIds.add(id);
  pruneOldestClaim();
  return true;
}

/** Keep the claim when an optimistic temp id is replaced by the server id. */
export function transferMessageEnterClaim(fromId, toId) {
  if (fromId == null || toId == null) return;
  const from = String(fromId);
  const to = String(toId);
  if (from === to) return;
  if (!claimedIds.has(from)) return;
  claimedIds.delete(from);
  claimedIds.add(to);
  pruneOldestClaim();
}
