import { useEffect, useState } from "react";
import { fetchAuthorizedMediaUrl } from "./mediaUrl";

const LOCAL_SRC_RE = /^(?:blob:|data:|\/default-)/i;

/**
 * Resolve a protected /api/media URL into a displayable src (blob URL)
 * using the in-memory Bearer token. Falls back when fetch fails.
 */
export function useAuthorizedMediaSrc(url, { fallback = "" } = {}) {
  const [fetched, setFetched] = useState({ url: null, src: null });

  useEffect(() => {
    if (!url || LOCAL_SRC_RE.test(url)) {
      return undefined;
    }

    let cancelled = false;
    let objectUrl = "";

    fetchAuthorizedMediaUrl(url)
      .then((fetchedSrc) => {
        if (cancelled) {
          if (fetchedSrc?.startsWith("blob:")) URL.revokeObjectURL(fetchedSrc);
          return;
        }
        if (fetchedSrc?.startsWith("blob:")) objectUrl = fetchedSrc;
        setFetched({ url, src: fetchedSrc || fallback });
      })
      .catch(() => {
        if (!cancelled) setFetched({ url, src: fallback });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, fallback]);

  if (!url) return fallback;
  if (LOCAL_SRC_RE.test(url)) return url;
  if (fetched.url === url && fetched.src) return fetched.src;
  return fallback;
}

export default useAuthorizedMediaSrc;
