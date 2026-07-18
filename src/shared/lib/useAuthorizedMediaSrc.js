import { useEffect, useState } from "react";
import { fetchAuthorizedMediaUrl } from "./mediaUrl";

const LOCAL_SRC_RE = /^(?:blob:|data:|\/default-)/i;

/**
 * Resolve a protected /api/media URL into a displayable src (blob URL)
 * using the in-memory Bearer token. Falls back when fetch fails.
 */
export function useAuthorizedMediaSrc(url, { fallback = "" } = {}) {
  const [src, setSrc] = useState(() => {
    if (!url) return fallback;
    if (LOCAL_SRC_RE.test(url)) return url;
    return fallback;
  });

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";

    if (!url) {
      setSrc(fallback);
      return undefined;
    }

    if (LOCAL_SRC_RE.test(url)) {
      setSrc(url);
      return undefined;
    }

    fetchAuthorizedMediaUrl(url)
      .then((fetched) => {
        if (cancelled) {
          if (fetched?.startsWith("blob:")) URL.revokeObjectURL(fetched);
          return;
        }
        if (fetched?.startsWith("blob:")) objectUrl = fetched;
        setSrc(fetched || fallback);
      })
      .catch(() => {
        if (!cancelled) setSrc(fallback);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, fallback]);

  return src;
}

export default useAuthorizedMediaSrc;
