import { useState, useCallback } from "react";
import { sendMessage } from "@features/messaging/api/messagesApi";
import { useAuth } from "@context/useAuth";
import { useMessagesStore } from "@features/messaging/store/messagesStore";
import { notify } from "@features/notifications/notify";

// Bridge хук. Позже sendMessageUsecase будет перенесён внутрь этой feature.
export function useSendMessage({ receiverId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const addPending = useMessagesStore((s) => s.addPendingMessage);
  const finalizePending = useMessagesStore((s) => s.finalizePendingMessage);
  const failPending = useMessagesStore((s) => s.failPendingMessage);

  const send = useCallback(
    async ({ text, file, mediaType, audioDuration }) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        if (text) formData.append("text", text);
        if (file) formData.append("media", file);
        if (mediaType) formData.append("mediaType", mediaType);
        if (audioDuration) formData.append("audioDuration", audioDuration);
        if (receiverId) formData.append("receiverId", receiverId);
        // optimistic
        const tempId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        addPending(receiverId || null, {
          _id: tempId,
          content: text || (file ? "Медиа" : ""),
          sender: {
            _id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
          receiver: receiverId || null,
          createdAt: new Date().toISOString(),
          isPinned: false,
          isDeleted: false,
          isEdited: false,
          mediaUrl: null,
          mediaType: mediaType || null,
          optimistic: true,
        });
        try {
          const dto = await sendMessage(formData);
          finalizePending(tempId, dto);
          return { ok: true, value: dto };
        } catch (e) {
          failPending(tempId);
          notify("error", "Не удалось отправить сообщение", {
            actions: [
              {
                label: "Повторить",
                onClick: () => {
                  // рекурсия повторной попытки
                  send({ text, file, mediaType, audioDuration });
                },
              },
            ],
          });
          throw e;
        }
      } catch (e) {
        setError(e);
        return { ok: false, error: e };
      } finally {
        setLoading(false);
      }
    },
    [receiverId, addPending, finalizePending, failPending, user]
  );

  return { send, loading, error };
}
