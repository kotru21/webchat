const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function resolveApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

export function getApiBaseUrl() {
  return API_BASE;
}
