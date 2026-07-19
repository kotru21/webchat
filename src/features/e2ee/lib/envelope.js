/** @typedef {{ v: 1, alg: string, salt: string, iv: string, ct: string }} E2eeEnvelope */

export const E2EE_ALG = "ECDH-P256+HKDF-SHA256+A256GCM";
export const E2EE_VERSION = 1;
export const PLAINTEXT_MAX = 1000;
export const HKDF_INFO_PREFIX = "webchat-e2ee-v1|";
export const AAD_PREFIX = "v1|";

export class E2eeError extends Error {
  /**
   * @param {"ENVELOPE_MALFORMED" | "DECRYPT_FAILED" | "PLAINTEXT_TOO_LONG"} code
   * @param {string} [message]
   */
  constructor(code, message) {
    super(message ?? code);
    this.name = "E2eeError";
    this.code = code;
  }
}

/** @param {string} a @param {string} b */
export function pairId(a, b) {
  return [a, b].sort().join(":");
}

/** @param {string} text */
export function utf8(text) {
  return new TextEncoder().encode(text);
}

/** @param {ArrayBuffer | Uint8Array} buf */
export function bytesToB64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) {
    s += String.fromCharCode(bytes[i]);
  }
  return btoa(s);
}

/** @param {string} b64 */
export function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

/**
 * @param {string} content
 * @returns {E2eeEnvelope}
 */
export function parseEnvelope(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new E2eeError("ENVELOPE_MALFORMED");
  }
  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    parsed.v !== E2EE_VERSION ||
    parsed.alg !== E2EE_ALG ||
    typeof parsed.salt !== "string" ||
    typeof parsed.iv !== "string" ||
    typeof parsed.ct !== "string"
  ) {
    throw new E2eeError("ENVELOPE_MALFORMED");
  }
  const keys = Object.keys(parsed);
  if (keys.length !== 5) {
    throw new E2eeError("ENVELOPE_MALFORMED");
  }
  return /** @type {E2eeEnvelope} */ (parsed);
}

/**
 * @param {E2eeEnvelope} envelope
 * @returns {string}
 */
export function serializeEnvelope(envelope) {
  return JSON.stringify({
    v: envelope.v,
    alg: envelope.alg,
    salt: envelope.salt,
    iv: envelope.iv,
    ct: envelope.ct,
  });
}

/** @param {string} plaintext */
export function assertPlaintextLimit(plaintext) {
  if (typeof plaintext !== "string" || plaintext.length > PLAINTEXT_MAX) {
    throw new E2eeError("PLAINTEXT_TOO_LONG");
  }
}
