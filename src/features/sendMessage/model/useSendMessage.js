import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@features/messaging/api/messagesApi";
import { useAuth } from "@context/useAuth";
import { useMessagesStore } from "@shared/store/messagesStore";
import { notify } from "@features/notifications/notify";
import { queryKeys } from "@shared/api/queryKeys";

// Bridge хук. Позже sendMessageUsecase будет перенесён внутрь этой feature.
export function useSendMessage({ receiverId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addPending = useMessagesStore((s) => s.addPendingMessage);
  const finalizePending = useMessagesStore((s) => s.finalizePendingMessage);
  const failPending = useMessagesStore((s) => s.failPendingMessage);
  const sendRef = useRef(null);

  const send = useCallback(
    async ({ text, file, mediaType, audioDuration }) => {
      if (!receiverId) {
        const err = new Error("Выберите собеседника");
        setError(err);
        notify("error", "Выберите чат, чтобы отправить сообщение");
        return { ok: false, error: err };
      }

      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        if (text) formData.append("text", text);
        if (file) formData.append("media", file);
        if (mediaType) formData.append("mediaType", mediaType);
        if (audioDuration) formData.append("audioDuration", audioDuration);
        formData.append("receiverId", receiverId);
        // optimistic
        const tempId = `temp-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        addPending(receiverId, {
          _id: tempId,
          content: text || (file ? "Медиа" : ""),
          sender: {
            _id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
          },
          receiver: receiverId,
          createdAt: new Date().toISOString(),
          mediaUrl: null,
          mediaType: mediaType || null,
          optimistic: true,
        });
        try {
          const dto = await sendMessage(formData);
          finalizePending(tempId, dto);
          void queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
          return { ok: true, value: dto };
        } catch (e) {
          failPending(tempId);
          const code = e?.response?.data?.code;
          const message =
            code === "DM_BLOCKED"
              ? "Диалог недоступен"
              : "Не удалось отправить сообщение";
          notify("error", message, {
            actions:
              code === "DM_BLOCKED"
                ? undefined
                : [
                    {
                      label: "Повторить",
                      onClick: () => {
                        sendRef.current?.({
                          text,
                          file,
                          mediaType,
                          audioDuration,
                        });
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
    [
      receiverId,
      addPending,
      finalizePending,
      failPending,
      user,
      queryClient,
    ]
  );

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  return { send, loading, error };
}
