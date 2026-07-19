/** Public EC P-256 JWK shape validation — rejects private `d` and extras. */

const ALLOWED_OPTIONAL = new Set(["ext", "key_ops", "alg", "use"]);
const REQUIRED = ["kty", "crv", "x", "y"] as const;

const isBase64UrlCoord = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  // P-256 coords are 32 bytes → ~43 base64url chars; allow 40–50.
  if (value.length < 40 || value.length > 50) return false;
  return /^[A-Za-z0-9_-]+$/.test(value);
};

export const validateAndMinimizePublicJwk = (
  raw: unknown
): { ok: true; jwkJson: string } | { ok: false; code: "INVALID_KEY" } => {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, code: "INVALID_KEY" };
  }

  const obj = raw as Record<string, unknown>;

  if ("d" in obj) {
    return { ok: false, code: "INVALID_KEY" };
  }

  for (const key of Object.keys(obj)) {
    if (
      !(REQUIRED as readonly string[]).includes(key) &&
      !ALLOWED_OPTIONAL.has(key)
    ) {
      return { ok: false, code: "INVALID_KEY" };
    }
  }

  for (const req of REQUIRED) {
    if (!(req in obj)) return { ok: false, code: "INVALID_KEY" };
  }

  if (obj.kty !== "EC" || obj.crv !== "P-256") {
    return { ok: false, code: "INVALID_KEY" };
  }
  if (!isBase64UrlCoord(obj.x) || !isBase64UrlCoord(obj.y)) {
    return { ok: false, code: "INVALID_KEY" };
  }

  const minimal = {
    kty: "EC",
    crv: "P-256",
    x: obj.x,
    y: obj.y,
  };

  return { ok: true, jwkJson: JSON.stringify(minimal) };
};
