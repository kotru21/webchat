import { useEffect, useState } from "react";
import { fetchAuthorizedMediaUrl, toAbsoluteMediaUrl } from "./mediaUrl";

const LOCAL_SRC_RE = /^(?:blob:|data:|\/default-)/i;

/** Shared blob URLs so remounts / new bubbles don't flash the default avatar. */
const mediaBlobCache = new Map();
const inflightFetches = new Map();

function cacheKeyFor(url) {
  return toAbsoluteMediaUrl(url) || url;
}

function readCached(url) {
  if (!url || LOCAL_SRC_RE.test(url)) return null;
  return mediaBlobCache.get(cacheKeyFor(url)) || null;
}

/**
 * Resolve a protected /api/media URL into a displayable src (blob URL)
 * using the in-memory Bearer token.
 *
 * Returns:
 * - fallback when url is empty
 * - url as-is for local/blob/data/default
 * - cached/fetched blob URL when ready
 * - undefined while the first fetch for this url is in flight (avoid default-avatar flash)
 */
export function useAuthorizedMediaSrc(url, { fallback = "" } = {}) {
  const cached = readCached(url);
  const [fetched, setFetched] = useState(() =>
    cached ? { key: cacheKeyFor(url), src: cached } : { key: null, src: null }
  );

  useEffect(() => {
    if (!url || LOCAL_SRC_RE.test(url)) {
      return undefined;
    }

    const key = cacheKeyFor(url);
    const hit = mediaBlobCache.get(key);
    if (hit) {
      setFetched({ key, src: hit });
      return undefined;
    }

    let cancelled = false;

    let request = inflightFetches.get(key);
    if (!request) {
      request = fetchAuthorizedMediaUrl(url)
        .then((fetchedSrc) => {
          if (fetchedSrc?.startsWith("blob:")) {
            mediaBlobCache.set(key, fetchedSrc);
          }
          return fetchedSrc || "";
        })
        .finally(() => {
          inflightFetches.delete(key);
        });
      inflightFetches.set(key, request);
    }

    request
      .then((fetchedSrc) => {
        if (cancelled) return;
        setFetched({ key, src: fetchedSrc || fallback });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key, src: fallback });
      });

    // Do not revoke blob URLs on unmount — they live in mediaBlobCache for reuse.
    return () => {
      cancelled = true;
    };
  }, [url, fallback]);

  if (!url) return fallback;
  if (LOCAL_SRC_RE.test(url)) return url;

  const key = cacheKeyFor(url);
  const fromCache = mediaBlobCache.get(key);
  if (fromCache) return fromCache;
  if (fetched.key === key && fetched.src) return fetched.src;
  // In-flight: signal "loading" so callers don't paint /default-avatar.png
  return undefined;
}

export default useAuthorizedMediaSrc;
