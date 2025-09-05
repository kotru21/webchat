import { useState, useCallback } from "react";
import { markReadUsecase } from "../../messaging/usecases/markRead";
import { useMessagesStore } from "../../messaging/store/messagesStore";

export function useMarkRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const markRead = useMessagesStore((s) => s.markRead);

  const mark = useCallback(
    async (message, currentUserId) => {
      if (
        !message ||
        message.sender._id === currentUserId ||
        message.readBy?.some((r) => r._id === currentUserId)
      ) {
        return { ok: true, skipped: true };
      }
      setLoading(true);
      setError(null);
      try {
        const res = await markReadUsecase(message);
        if (res.ok) {
          markRead(message._id, [
            ...(message.readBy || []),
            { _id: currentUserId },
          ]);
        }
        return res;
      } catch (e) {
        setError(e.message || "Ошибка отметки прочтения");
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [markRead]
  );

  return { mark, loading, error, resetError: () => setError(null) };
}
