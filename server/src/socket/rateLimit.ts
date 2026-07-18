interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export const allowSocketEvent = (
  userId: string,
  limit = 30,
  windowMs = 60_000
): boolean => {
  const now = Date.now();
  const current = buckets.get(userId);
  if (!current || current.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
};
