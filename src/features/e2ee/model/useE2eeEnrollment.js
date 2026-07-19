import { useEffect, useState } from "react";
import { useAuth } from "@context/useAuth";
import { ensureIdentity, resetIdentityCache } from "../lib/session.js";

/**
 * Enrolls E2EE identity after auth. Failures are non-fatal (composer stays plaintext).
 * Ready is derived by comparing enrolled userId — no sync setState on logout.
 */
export function useE2eeEnrollment() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [readyForUserId, setReadyForUserId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!userId) {
      resetIdentityCache();
      return undefined;
    }

    let cancelled = false;
    ensureIdentity(userId)
      .then(() => {
        if (!cancelled) setReadyForUserId(userId);
      })
      .catch(() => {
        if (!cancelled) setReadyForUserId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return Boolean(userId) && readyForUserId === userId;
}
