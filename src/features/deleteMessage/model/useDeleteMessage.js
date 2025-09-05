import { useState, useCallback } from "react";
import { deleteMessageUsecase } from "../../messaging/usecases/deleteMessage";
import { useMessagesStore } from "../../messaging/store/messagesStore";

export function useDeleteMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const remove = useMessagesStore((s) => s.removeMessage);

  const deleteMessage = useCallback(
    async (messageId) => {
      setLoading(true);
      setError(null);
      try {
        const res = await deleteMessageUsecase(messageId);
        if (res.ok) remove(messageId);
        return res;
      } catch (e) {
        setError(e.message || "Ошибка удаления");
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [remove]
  );

  return { deleteMessage, loading, error, resetError: () => setError(null) };
}
