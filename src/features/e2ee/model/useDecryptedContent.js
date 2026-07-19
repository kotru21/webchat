import { useEffect, useState } from "react";
import { useAuth } from "@context/useAuth";
import { decryptDm } from "../lib/crypto.js";
import {
  cachePlaintext,
  getCachedPlaintext,
} from "../lib/plaintextCache.js";
import { ensureIdentity, getCachedIdentity } from "../lib/session.js";
import { getPin } from "../lib/keyStore.js";
import { resolvePeerTrust } from "../lib/peerTrust.js";

/**
 * Decrypt e2ee-v1 message content for display. Never throws; never logs plaintext.
 * Sync branches (plain / cache / optimistic) resolve during render — no setState in effect.
 * @param {{
 *   _id?: string,
 *   content?: string,
 *   contentFormat?: string,
 *   localPlaintext?: string,
 *   sender?: { _id?: string },
 *   receiver?: { _id?: string } | string | null,
 *   optimistic?: boolean,
 * }} message
 * @param {{ id: string }} currentUser
 */
export function useDecryptedContent(message, currentUser) {
  const { user } = useAuth();
  const me = currentUser?.id || user?.id;
  const format = message?.contentFormat || "plain";
  const isE2ee = format === "e2ee-v1";
  const cached =
    message?.localPlaintext ||
    (message?._id ? getCachedPlaintext(message._id) : null);

  /** @type {string | null} null ⇒ need async decrypt */
  const syncText = !isE2ee
    ? message?.content || ""
    : cached
      ? cached
      : message?.optimistic
        ? message.content || ""
        : null;

  const contentKey = [
    message?._id ?? "",
    typeof message?.content === "string" ? message.content.length : 0,
    me ?? "",
  ].join(":");

  const [asyncState, setAsyncState] = useState({
    key: "",
    text: "",
    failed: false,
    done: false,
  });

  // Adjust bookkeeping during render when the message identity changes (React pattern).
  if (syncText === null && asyncState.key !== contentKey) {
    setAsyncState({ key: contentKey, text: "", failed: false, done: false });
  }

  useEffect(() => {
    if (syncText !== null) return undefined;
    if (!me) return undefined;

    let cancelled = false;
    const key = contentKey;

    (async () => {
      try {
        const pair =
          getCachedIdentity(me) || (await ensureIdentity(me));
        const senderId =
          typeof message.sender === "object"
            ? message.sender?._id
            : message.sender;
        const receiverId =
          typeof message.receiver === "object"
            ? message.receiver?._id
            : message.receiver;

        if (!senderId || !receiverId) {
          throw new Error("missing ids");
        }

        const peerId = senderId === me ? receiverId : senderId;
        let pin = await getPin(me, peerId);
        if (!pin?.jwk) {
          const trust = await resolvePeerTrust(me, peerId);
          if (trust.status !== "encrypted" || !trust.peerJwk) {
            throw new Error("no peer key");
          }
          pin = { jwk: trust.peerJwk, fingerprint: trust.peerFingerprint };
        }

        const plaintext = await decryptDm({
          myPrivate: pair.privateKey,
          peerPublicJwk: pin.jwk,
          senderId,
          receiverId,
          envelope: message.content,
        });
        if (cancelled) return;
        if (message._id) cachePlaintext(message._id, plaintext);
        setAsyncState({ key, text: plaintext, failed: false, done: true });
      } catch {
        if (cancelled) return;
        setAsyncState({ key, text: "", failed: true, done: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    syncText,
    contentKey,
    me,
    message?.content,
    message?._id,
    message?.sender,
    message?.receiver,
  ]);

  if (syncText !== null) {
    return { text: syncText, failed: false, pending: false, isE2ee };
  }

  const ready = asyncState.key === contentKey && asyncState.done;
  return {
    text: ready ? asyncState.text : "",
    failed: ready ? asyncState.failed : false,
    pending: !ready,
    isE2ee: true,
  };
}
