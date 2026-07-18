import { getAccessToken } from "./accessToken";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const ABSOLUTE_URL_RE = /^(?:https?:|blob:|data:)/i;

const toApiMediaPath = (url) => {
  if (!url) return "";
  if (url.startsWith("/api/media/")) {
    return url.replace("/api/media/banners/", "/api/media/covers/");
  }
  if (url.startsWith("/uploads/")) {
    return `/api/media/${url
      .slice("/uploads/".length)
      .replace(/^banners\//, "covers/")}`;
  }
  if (url.startsWith("uploads/")) {
    return `/api/media/${url
      .slice("uploads/".length)
      .replace(/^banners\//, "covers/")}`;
  }
  return url.startsWith("/") ? url : `/${url}`;
};

/** Only same-app media API paths may receive the in-memory Bearer token. */
export const isAuthorizedMediaTarget = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/api/media/")) return true;
  if (API_BASE && url.startsWith(`${API_BASE}/api/media/`)) return true;
  return false;
};

export function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  // Adblockers block path segment "banners" — rewrite legacy URLs.
  const withoutBannedSegment = url.replace(
    /\/api\/media\/banners\//g,
    "/api/media/covers/"
  );
  if (ABSOLUTE_URL_RE.test(withoutBannedSegment)) return withoutBannedSegment;

  const normalizedPath = toApiMediaPath(withoutBannedSegment);
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

export async function fetchAuthorizedMediaUrl(url) {
  if (!url) return "";
  if (/^(?:blob:|data:)/i.test(url)) return url;

  const absolute = toAbsoluteMediaUrl(url);
  if (!absolute) return "";

  // Never attach Bearer to third-party hosts (token exfiltration).
  if (!isAuthorizedMediaTarget(url) && !isAuthorizedMediaTarget(absolute)) {
    throw new Error("MEDIA_UNTRUSTED_URL");
  }

  const token = getAccessToken();
  const response = await fetch(absolute, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`MEDIA_FETCH_FAILED_${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function stripApiBase(url) {
  if (!url) return "";
  if (ABSOLUTE_URL_RE.test(url)) return url;
  if (!API_BASE) return url;

  if (url.startsWith(API_BASE)) {
    const relativePath = url.slice(API_BASE.length);
    return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  }

  return url;
}
