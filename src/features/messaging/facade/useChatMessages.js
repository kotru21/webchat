import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@context/useAuth";
import { getMessages } from "@features/messaging/api/messagesApi";
import { getChatKey, useMessagesStore } from "@shared/store/messagesStore";
import { resolvePeerId } from "@shared/lib/peerId";

export const useChatMessages = (selectedUser) => {
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const storeSetChatMessages = useMessagesStore((s) => s.setChatMessages);

  const peerId = resolvePeerId(selectedUser);
  const chatKey = getChatKey(peerId);
  const EMPTY = useMemo(() => [], []);
  const reactiveMessages = useMessagesStore(
    (state) => state.chats[chatKey]?.messages ?? EMPTY
  );

  useEffect(() => {
    let active = true;
    const receiverId = peerId;

    // DM-only API: do not call GET /api/messages without receiverId (400 INVALID_PEER).
    if (!receiverId) {
      return undefined;
    }

    (async () => {
      setMessagesLoading(true);
      try {
        const data = await getMessages(receiverId);
        if (!active) return;
        storeSetChatMessages(receiverId, data);
        setError("");
      } catch (loadError) {
        if (!active || loadError.name === "AbortError") return;
        console.error("Ошибка при загрузке сообщений:", loadError);
        if (loadError.response) {
          switch (loadError.response.status) {
            case 401:
              setError("Требуется авторизация. Пожалуйста, войдите заново");
              break;
            case 403:
              setError("У вас нет доступа к этому чату");
              break;
            case 404:
              setError("Чат не найден");
              break;
            case 429:
              setError("Слишком много запросов. Пожалуйста, повторите позже");
              break;
            case 500:
              setError("Ошибка сервера. Пожалуйста, повторите позже");
              break;
            default:
              setError("Не удалось загрузить сообщения");
          }
        } else if (loadError.request) {
          setError("Сервер недоступен. Проверьте подключение к интернету");
        } else {
          setError("Ошибка при загрузке сообщений");
        }
      } finally {
        if (active) setMessagesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [peerId, user.id, storeSetChatMessages]);

  return {
    messages: reactiveMessages,
    loading: Boolean(peerId) && messagesLoading,
    error: peerId ? error : "",
    setError,
  };
};

export default useChatMessages;
