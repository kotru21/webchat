import { useMemo, useEffect } from "react";
import { useChatMessages } from "./useChatMessages";
import { useSendMessage } from "@features/sendMessage";
import useChatSocket from "./useChatSocket";
import { useAuth } from "@context/useAuth";
import { useChatStore } from "@shared/store/chatStore";

// Фасад объединяющий сообщения, сокет и счётчики непрочитанного
export function useChatFeature({ onError } = {}) {
  // Берём selectedUser из zustand
  const selectedUser = useChatStore((s) => s.selectedUser);
  const { user } = useAuth();
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const resetUnread = useChatStore((s) => s.resetUnread);

  const {
    messages,
    loading: messagesLoading,
    error,
    setError,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
    pinMessageHandler,
  } = useChatMessages(selectedUser);

  // отправка теперь напрямую через feature sendMessage (включает optimistic)
  const { send, loading: sending } = useSendMessage({
    receiverId: selectedUser?.id || null,
  });

  useChatSocket({ user, selectedUser, incrementUnread });

  // Пробрасываем ошибки через эффект, чтобы не вызывать setState в рендере
  useEffect(() => {
    if (error && onError) {
      onError(error);
      setError("");
    }
  }, [error, onError, setError]);

  const api = useMemo(
    () => ({
      send, // оставляем для совместимости, но Chat.jsx может теперь использовать useSendMessageForm
      markRead: markAsReadHandler,
      edit: editMessageHandler,
      remove: deleteMessageHandler,
      pin: pinMessageHandler,
    }),
    [
      send,
      markAsReadHandler,
      editMessageHandler,
      deleteMessageHandler,
      pinMessageHandler,
    ]
  );

  return {
    messages,
    loading: messagesLoading || sending,
    api,
    incrementUnread,
    resetUnread,
  };
}

export default useChatFeature;
