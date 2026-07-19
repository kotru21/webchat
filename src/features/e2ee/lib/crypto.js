import {
  AAD_PREFIX,
  assertPlaintextLimit,
  b64ToBytes,
  bytesToB64,
  E2EE_ALG,
  E2EE_VERSION,
  E2eeError,
  HKDF_INFO_PREFIX,
  pairId,
  parseEnvelope,
  serializeEnvelope,
  utf8,
} from "./envelope.js";

/**
 * @param {SubtleCrypto} [subtle]
 */
function getSubtle(subtle) {
  return subtle ?? globalThis.crypto.subtle;
}

/**
 * @param {SubtleCrypto} [subtle]
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateIdentityKeyPair(subtle) {
  return getSubtle(subtle).generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );
}

/**
 * @param {CryptoKeyPair} pair
 * @param {SubtleCrypto} [subtle]
 */
export async function exportPublicJwk(pair, subtle) {
  return /** @type {JsonWebKey} */ (
    await getSubtle(subtle).exportKey("jwk", pair.publicKey)
  );
}

/**
 * Fingerprint = SHA-256 over uncompressed public point (65 bytes), 8×4 hex groups.
 * @param {CryptoKey} publicKey
 * @param {SubtleCrypto} [subtle]
 */
export async function fingerprint(publicKey, subtle) {
  const s = getSubtle(subtle);
  const raw = await s.exportKey("raw", publicKey);
  const digest = await s.digest("SHA-256", raw);
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const groups = [];
  for (let i = 0; i < 32; i += 4) {
    groups.push(hex.slice(i, i + 4));
  }
  return groups.join(" ");
}

/**
 * @param {JsonWebKey} jwk
 * @param {SubtleCrypto} [subtle]
 */
export async function importPeerPublicJwk(jwk, subtle) {
  return getSubtle(subtle).importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * @param {{
 *   myPrivate: CryptoKey,
 *   peerPublicJwk: JsonWebKey,
 *   senderId: string,
 *   receiverId: string,
 *   plaintext: string,
 *   subtle?: SubtleCrypto,
 * }} opts
 * @returns {Promise<string>} envelope JSON string
 */
export async function encryptDm(opts) {
  assertPlaintextLimit(opts.plaintext);
  const s = getSubtle(opts.subtle);
  const peerPublic = await importPeerPublicJwk(opts.peerPublicJwk, s);
  const sharedBits = await s.deriveBits(
    { name: "ECDH", public: peerPublic },
    opts.myPrivate,
    256
  );

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ikm = await s.importKey("raw", sharedBits, "HKDF", false, [
    "deriveKey",
  ]);
  const info = utf8(HKDF_INFO_PREFIX + pairId(opts.senderId, opts.receiverId));
  const aesKey = await s.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const additionalData = utf8(
    AAD_PREFIX + opts.senderId + "|" + opts.receiverId
  );
  const ct = await s.encrypt(
    { name: "AES-GCM", iv, additionalData },
    aesKey,
    utf8(opts.plaintext)
  );

  return serializeEnvelope({
    v: E2EE_VERSION,
    alg: E2EE_ALG,
    salt: bytesToB64(salt),
    iv: bytesToB64(iv),
    ct: bytesToB64(ct),
  });
}

/**
 * @param {{
 *   myPrivate: CryptoKey,
 *   peerPublicJwk: JsonWebKey,
 *   senderId: string,
 *   receiverId: string,
 *   envelope: string,
 *   subtle?: SubtleCrypto,
 * }} opts
 * @returns {Promise<string>}
 */
export async function decryptDm(opts) {
  const s = getSubtle(opts.subtle);
  let envelope;
  try {
    envelope = parseEnvelope(opts.envelope);
  } catch (err) {
    if (err instanceof E2eeError) throw err;
    throw new E2eeError("ENVELOPE_MALFORMED");
  }

  try {
    const peerPublic = await importPeerPublicJwk(opts.peerPublicJwk, s);
    const sharedBits = await s.deriveBits(
      { name: "ECDH", public: peerPublic },
      opts.myPrivate,
      256
    );
    const salt = b64ToBytes(envelope.salt);
    const iv = b64ToBytes(envelope.iv);
    const ct = b64ToBytes(envelope.ct);
    if (salt.length !== 32 || iv.length !== 12 || ct.length === 0) {
      throw new E2eeError("ENVELOPE_MALFORMED");
    }

    const ikm = await s.importKey("raw", sharedBits, "HKDF", false, [
      "deriveKey",
    ]);
    const info = utf8(
      HKDF_INFO_PREFIX + pairId(opts.senderId, opts.receiverId)
    );
    const aesKey = await s.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt, info },
      ikm,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    const additionalData = utf8(
      AAD_PREFIX + opts.senderId + "|" + opts.receiverId
    );
    const plainBuf = await s.decrypt(
      { name: "AES-GCM", iv, additionalData },
      aesKey,
      ct
    );
    return new TextDecoder().decode(plainBuf);
  } catch (err) {
    if (err instanceof E2eeError) throw err;
    throw new E2eeError("DECRYPT_FAILED");
  }
}
