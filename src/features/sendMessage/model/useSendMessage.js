import { useState, useCallback } from "react";
import { sendMessageUsecase } from "../../messaging/usecases/sendMessage";

// Bridge хук. Позже sendMessageUsecase будет перенесён внутрь этой feature.
export function useSendMessage({ receiverId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(
    async ({ text, file, mediaType, audioDuration }) => {
      setLoading(true);
      setError(null);
      try {
        // Пока используем существующий usecase (text/file). audio metadata через formData
        const formData = new FormData();
        if (text) formData.append("text", text);
        if (file) formData.append("media", file);
        if (mediaType) formData.append("mediaType", mediaType);
        if (audioDuration) formData.append("audioDuration", audioDuration);
        if (receiverId) formData.append("receiverId", receiverId);
        // Временный прямой вызов sendMessageUsecase через адаптацию
        const dtoResult = await sendMessageUsecase({ text, file, receiverId });
        return dtoResult;
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [receiverId]
  );

  return { send, loading, error };
}
