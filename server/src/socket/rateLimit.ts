interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

let lastSweepAt = 0;
const SWEEP_INTERVAL_MS = 60_000;

const sweepExpiredBuckets = (now: number): void => {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const allowSocketEvent = (
  userId: string,
  limit = 30,
  windowMs = 60_000
): boolean => {
  const now = Date.now();
  sweepExpiredBuckets(now);

  const current = buckets.get(userId);
  if (!current || current.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
};
