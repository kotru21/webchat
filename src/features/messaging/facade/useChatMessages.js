import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@context/useAuth";
import { getMessages } from "@features/messaging/api/messagesApi";
import { useMessagesStore } from "@features/messaging/store/messagesStore";
import { useEditMessage } from "@features/editMessage";
import { useDeleteMessage } from "@features/deleteMessage";
import { useMarkRead } from "@features/markRead";
import { usePinMessage } from "@features/pinMessage";

export const useChatMessages = (selectedUser) => {
  const [loading] = useState(false); // legacy: отправка теперь в useSendMessage
  const [messagesLoading, setMessagesLoading] = useState(false); // загрузка списка
  const [error, setError] = useState("");
  const { user } = useAuth();

  const storeSetChatMessages = useMessagesStore((s) => s.setChatMessages);

  const chatKey = selectedUser?.id ? `private:${selectedUser.id}` : "general";
  const EMPTY = useMemo(() => [], []);
  const reactiveMessages = useMessagesStore(
    (state) => state.chats[chatKey]?.messages ?? EMPTY
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      setMessagesLoading(true);
      try {
        const data = await getMessages(selectedUser?.id, {
          signal: controller.signal,
        });
        if (!active) return;
        storeSetChatMessages(selectedUser?.id, data);
        setError("");
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        console.error("Ошибка при загрузке сообщений:", error);
        if (error.response) {
          switch (error.response.status) {
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
        } else if (error.request) {
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
      controller.abort();
    };
  }, [selectedUser?.id, user.id, storeSetChatMessages]);

  const { editMessage: editMessageBridge } = useEditMessage();
  const { deleteMessage: deleteMessageBridge } = useDeleteMessage();
  const { mark: markReadBridge } = useMarkRead();
  const { togglePin: pinMessageBridge } = usePinMessage();

  const markAsReadHandler = async (message) => {
    await markReadBridge(message, user.id);
  };

  const editMessageHandler = async (messageId, formData) => {
    const content = formData.get("content");
    const file = formData.get("media");
    const removeMedia = formData.get("removeMedia") === "true";
    const res = await editMessageBridge(messageId, {
      content,
      file,
      removeMedia,
    });
    if (!res.ok) setError(res.error);
    return !!res.ok;
  };

  const deleteMessageHandler = async (messageId) => {
    const res = await deleteMessageBridge(messageId);
    if (!res.ok && res.error) setError(res.error);
    return !!res.ok;
  };

  const pinMessageHandler = async (messageId, isPinned) => {
    const res = await pinMessageBridge(messageId, isPinned);
    return !!res.ok;
  };

  return {
    messages: reactiveMessages,
    loading,
    messagesLoading,
    error,
    setError,
    setMessages: () => {},
    // отправка теперь через useSendMessage (feature sendMessage)
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
    pinMessageHandler,
  };
};

export default useChatMessages;
