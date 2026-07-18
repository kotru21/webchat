/**
 * Normalize peer identity across API shapes (`id` from auth/store, `_id` from DTOs).
 */
export function resolvePeerId(user) {
  if (!user) return null;
  return user.id || user._id || null;
}
