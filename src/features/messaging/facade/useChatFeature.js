import { useRef, useCallback, useMemo } from "react";
import useChatMessages from "../../../hooks/useChatMessages";
import useChatSocket from "../../../hooks/useChatSocket";
import { useAuth } from "../../../context/AuthContext";

// Фасад объединяющий сообщения, сокет и счётчики непрочитанного
export function useChatFeature(selectedUser, { onError }) {
  const { user } = useAuth();
  const unreadCountsRef = useRef({ general: 0 });

  const setUnreadCounts = useCallback((updater) => {
    unreadCountsRef.current =
      typeof updater === "function"
        ? updater(unreadCountsRef.current)
        : updater;
  }, []);

  const {
    messages,
    loading,
    error,
    setError,
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
    pinMessageHandler,
  } = useChatMessages(selectedUser);

  useChatSocket({ user, selectedUser, setUnreadCounts });

  // проброс ошибок наружу единообразно
  if (error && onError) {
    onError(error);
    setError("");
  }

  const api = useMemo(
    () => ({
      send: sendMessageHandler,
      markRead: markAsReadHandler,
      edit: editMessageHandler,
      remove: deleteMessageHandler,
      pin: pinMessageHandler,
    }),
    [
      sendMessageHandler,
      markAsReadHandler,
      editMessageHandler,
      deleteMessageHandler,
      pinMessageHandler,
    ]
  );

  return {
    messages,
    loading,
    api,
    unreadCounts: unreadCountsRef.current,
  };
}

export default useChatFeature;
