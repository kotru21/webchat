const DB_NAME = "webchat-e2ee";
const DB_VERSION = 1;
const STORE_KEYS = "keys";
const STORE_PINS = "pins";

/**
 * @param {string} ownerUserId
 */
function identityRecordKey(ownerUserId) {
  return `identity:${ownerUserId}`;
}

/**
 * Pin is scoped to the logged-in owner so accounts on a shared browser profile
 * do not inherit each other's TOFU trust.
 * @param {string} ownerUserId
 * @param {string} peerId
 */
function pinRecordKey(ownerUserId, peerId) {
  return `${ownerUserId}:${peerId}`;
}

/**
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB_OPEN_FAILED"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS);
      }
      if (!db.objectStoreNames.contains(STORE_PINS)) {
        db.createObjectStore(STORE_PINS);
      }
    };
  });
}

/**
 * @template T
 * @param {IDBRequest<T>} req
 * @returns {Promise<T>}
 */
function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IDB_REQUEST_FAILED"));
  });
}

/**
 * @param {string} ownerUserId
 * @returns {Promise<CryptoKeyPair | null>}
 */
export async function loadIdentity(ownerUserId) {
  if (!ownerUserId) return null;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_KEYS, "readonly");
    const store = tx.objectStore(STORE_KEYS);
    const value = await reqToPromise(store.get(identityRecordKey(ownerUserId)));
    if (
      value &&
      typeof value === "object" &&
      value.privateKey &&
      value.publicKey
    ) {
      return /** @type {CryptoKeyPair} */ (value);
    }
    return null;
  } finally {
    db.close();
  }
}

/**
 * @param {string} ownerUserId
 * @param {CryptoKeyPair} cryptoKeyPair
 */
export async function saveIdentity(ownerUserId, cryptoKeyPair) {
  if (!ownerUserId) {
    throw new Error("IDENTITY_OWNER_REQUIRED");
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_KEYS, "readwrite");
    const store = tx.objectStore(STORE_KEYS);
    await reqToPromise(
      store.put(cryptoKeyPair, identityRecordKey(ownerUserId))
    );
  } finally {
    db.close();
  }
}

/**
 * @param {string} ownerUserId
 * @param {string} peerId
 * @returns {Promise<{ jwk: JsonWebKey, fingerprint: string, pinnedAt: string } | null>}
 */
export async function getPin(ownerUserId, peerId) {
  if (!ownerUserId || !peerId) return null;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_PINS, "readonly");
    const store = tx.objectStore(STORE_PINS);
    const value = await reqToPromise(
      store.get(pinRecordKey(ownerUserId, peerId))
    );
    if (
      value &&
      typeof value === "object" &&
      value.jwk &&
      typeof value.fingerprint === "string"
    ) {
      return /** @type {{ jwk: JsonWebKey, fingerprint: string, pinnedAt: string }} */ (
        value
      );
    }
    return null;
  } finally {
    db.close();
  }
}

/**
 * @param {string} ownerUserId
 * @param {string} peerId
 * @param {JsonWebKey} jwk
 * @param {string} fp
 */
export async function setPin(ownerUserId, peerId, jwk, fp) {
  if (!ownerUserId || !peerId) {
    throw new Error("PIN_SCOPE_REQUIRED");
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_PINS, "readwrite");
    const store = tx.objectStore(STORE_PINS);
    await reqToPromise(
      store.put(
        {
          jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
          fingerprint: fp,
          pinnedAt: new Date().toISOString(),
        },
        pinRecordKey(ownerUserId, peerId)
      )
    );
  } finally {
    db.close();
  }
}

/**
 * @param {string} ownerUserId
 * @param {string} peerId
 */
export async function clearPin(ownerUserId, peerId) {
  if (!ownerUserId || !peerId) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_PINS, "readwrite");
    const store = tx.objectStore(STORE_PINS);
    await reqToPromise(store.delete(pinRecordKey(ownerUserId, peerId)));
  } finally {
    db.close();
  }
}
