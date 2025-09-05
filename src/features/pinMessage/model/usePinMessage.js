import { useState, useCallback } from "react";
import { pinMessageUsecase } from "../../messaging/usecases/pinMessage";
import { useMessagesStore } from "../../messaging/store/messagesStore";

export function usePinMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pin = useMessagesStore((s) => s.pinMessage);

  const togglePin = useCallback(
    async (messageId, isPinned) => {
      setLoading(true);
      setError(null);
      try {
        const res = await pinMessageUsecase(messageId, isPinned);
        if (res.ok) {
          pin(messageId, isPinned);
        }
        return res;
      } catch (e) {
        setError(e.message || "Ошибка закрепления");
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [pin]
  );

  return { togglePin, loading, error, resetError: () => setError(null) };
}
