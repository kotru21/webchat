import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@context/useAuth";
import { resolvePeerTrust, trustNewPeerKey } from "../lib/peerTrust.js";
import { getMyFingerprint } from "../lib/session.js";

/**
 * @param {string | null | undefined} peerId
 */
export function usePeerE2ee(peerId) {
  const { user } = useAuth();
  const ownerUserId = user?.id ?? null;
  const [state, setState] = useState({
    status: /** @type {"loading" | "plain" | "encrypted" | "changed" | "locked"} */ (
      "loading"
    ),
    peerJwk: null,
    peerFingerprint: null,
    pinnedFingerprint: null,
    myFingerprint: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!peerId || !ownerUserId) {
      setState((s) => ({
        ...s,
        status: "plain",
        peerJwk: null,
        peerFingerprint: null,
        pinnedFingerprint: null,
      }));
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const [trust, myFingerprint] = await Promise.all([
        resolvePeerTrust(ownerUserId, peerId),
        getMyFingerprint(ownerUserId).catch(() => null),
      ]);
      setState({
        status: trust.status,
        peerJwk: trust.peerJwk,
        peerFingerprint: trust.peerFingerprint,
        pinnedFingerprint: trust.pinnedFingerprint,
        myFingerprint,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "plain",
        error: err,
      }));
    }
  }, [peerId, ownerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const acceptNewKey = useCallback(async () => {
    if (
      !ownerUserId ||
      !peerId ||
      !state.peerJwk ||
      !state.peerFingerprint
    ) {
      return;
    }
    await trustNewPeerKey(
      ownerUserId,
      peerId,
      state.peerJwk,
      state.peerFingerprint
    );
    await refresh();
  }, [
    ownerUserId,
    peerId,
    state.peerJwk,
    state.peerFingerprint,
    refresh,
  ]);

  const sendBlocked =
    state.status === "changed" || state.status === "locked";

  return {
    ...state,
    sendBlocked,
    refresh,
    acceptNewKey,
  };
}
