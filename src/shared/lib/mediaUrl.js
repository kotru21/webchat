const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const ABSOLUTE_URL_RE = /^(?:https?:|blob:|data:)/i;

export function toAbsoluteMediaUrl(url) {
  if (!url) return "";
  if (ABSOLUTE_URL_RE.test(url)) return url;

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
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
