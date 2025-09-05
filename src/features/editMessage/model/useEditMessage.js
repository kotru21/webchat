import { useState, useCallback } from "react";
import { editMessageUsecase } from "../../messaging/usecases/editMessage";
import { useMessagesStore } from "../../messaging/store/messagesStore"; // bridge

export function useEditMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const update = useMessagesStore((s) => s.updateMessage);

  const editMessage = useCallback(
    async (messageId, { content, file, removeMedia }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await editMessageUsecase(messageId, {
          content,
          file,
          removeMedia,
        });
        if (!res.ok) {
          setError(res.error);
          return res;
        }
        update(messageId, res.value);
        return res;
      } catch (e) {
        setError(e.message || "Ошибка редактирования");
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [update]
  );

  return { editMessage, loading, error, resetError: () => setError(null) };
}
