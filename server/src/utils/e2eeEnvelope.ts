/** Normative E2EE envelope helpers (WAVE3 §3). Shape validation only — no crypto. */

export const E2EE_ALG = "ECDH-P256+HKDF-SHA256+A256GCM";
export const E2EE_CONTENT_MAX = 8192;
export const PLAIN_CONTENT_MAX = 1000;

const ENVELOPE_KEYS = new Set(["v", "alg", "salt", "iv", "ct"]);

const decodeBase64 = (value: string): Buffer | null => {
  if (typeof value !== "string" || value.length === 0) return null;
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return null;
  try {
    // Support both standard and base64url (WebCrypto / btoa).
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const buf = Buffer.from(normalized, "base64");
    if (buf.length === 0) return null;
    return buf;
  } catch {
    return null;
  }
};

export type ContentFormat = "plain" | "e2ee-v1";

export const normalizeContentFormat = (raw: unknown): ContentFormat | null => {
  if (raw === undefined || raw === null || raw === "") return "plain";
  if (raw === "plain" || raw === "e2ee-v1") return raw;
  return null;
};

/** Returns null if valid; otherwise an error code. */
export const validateE2eeEnvelopeContent = (content: string): string | null => {
  if (typeof content !== "string") return "INVALID_ENVELOPE";
  if (content.length === 0 || content.length > E2EE_CONTENT_MAX) {
    return "INVALID_ENVELOPE";
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return "INVALID_ENVELOPE";
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "INVALID_ENVELOPE";
  }

  const obj = parsed as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== ENVELOPE_KEYS.size || keys.some((k) => !ENVELOPE_KEYS.has(k))) {
    return "INVALID_ENVELOPE";
  }

  if (obj.v !== 1) return "INVALID_ENVELOPE";
  if (obj.alg !== E2EE_ALG) return "INVALID_ENVELOPE";

  const salt = decodeBase64(String(obj.salt ?? ""));
  const iv = decodeBase64(String(obj.iv ?? ""));
  const ct = decodeBase64(String(obj.ct ?? ""));
  if (!salt || salt.length !== 32) return "INVALID_ENVELOPE";
  if (!iv || iv.length !== 12) return "INVALID_ENVELOPE";
  if (!ct || ct.length === 0) return "INVALID_ENVELOPE";

  return null;
};
