import { fingerprint, importPeerPublicJwk } from "./crypto.js";
import { getPin, setPin } from "./keyStore.js";
import { getPeerPublicKey } from "../api/e2eeApi.js";

/**
 * @typedef {"plain" | "encrypted" | "changed" | "locked"} PeerE2eeStatus
 *
 * plain — no pin, peer has no key → plaintext OK
 * encrypted — pin matches fetched key → encrypt
 * changed — pin mismatch → hard block until re-pin
 * locked — pin exists but server 404 (downgrade) → hard block
 */

/**
 * @param {JsonWebKey} a
 * @param {JsonWebKey} b
 */
export function jwkMatches(a, b) {
  return (
    a &&
    b &&
    a.kty === b.kty &&
    a.crv === b.crv &&
    a.x === b.x &&
    a.y === b.y
  );
}

/**
 * Resolve TOFU / encrypt-lock state for a peer. Never silent re-pin.
 * @param {string} ownerUserId — logged-in account (pin namespace)
 * @param {string} peerId
 * @returns {Promise<{
 *   status: PeerE2eeStatus,
 *   peerJwk: JsonWebKey | null,
 *   peerFingerprint: string | null,
 *   pinnedFingerprint: string | null,
 * }>}
 */
export async function resolvePeerTrust(ownerUserId, peerId) {
  if (!ownerUserId) {
    return {
      status: "plain",
      peerJwk: null,
      peerFingerprint: null,
      pinnedFingerprint: null,
    };
  }

  const pin = await getPin(ownerUserId, peerId);
  let fetched = null;
  let fetch404 = false;

  try {
    const res = await getPeerPublicKey(peerId);
    fetched = res.publicKeyJwk;
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) {
      fetch404 = true;
    } else {
      throw err;
    }
  }

  if (fetch404) {
    if (pin) {
      return {
        status: "locked",
        peerJwk: null,
        peerFingerprint: null,
        pinnedFingerprint: pin.fingerprint,
      };
    }
    return {
      status: "plain",
      peerJwk: null,
      peerFingerprint: null,
      pinnedFingerprint: null,
    };
  }

  const peerKey = await importPeerPublicJwk(fetched);
  const peerFingerprint = await fingerprint(peerKey);

  if (!pin) {
    await setPin(ownerUserId, peerId, fetched, peerFingerprint);
    return {
      status: "encrypted",
      peerJwk: fetched,
      peerFingerprint,
      pinnedFingerprint: peerFingerprint,
    };
  }

  if (jwkMatches(pin.jwk, fetched)) {
    return {
      status: "encrypted",
      peerJwk: fetched,
      peerFingerprint,
      pinnedFingerprint: pin.fingerprint,
    };
  }

  return {
    status: "changed",
    peerJwk: fetched,
    peerFingerprint,
    pinnedFingerprint: pin.fingerprint,
  };
}

/**
 * Explicit user acceptance of a new peer key after mismatch.
 * @param {string} ownerUserId
 * @param {string} peerId
 * @param {JsonWebKey} jwk
 * @param {string} fp
 */
export async function trustNewPeerKey(ownerUserId, peerId, jwk, fp) {
  await setPin(ownerUserId, peerId, jwk, fp);
}
