import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getMessages } from "../services/api";
import { useMessagesStore } from "../features/messaging/store/messagesStore";
import { sendMessageUsecase } from "../features/messaging/usecases/sendMessage";
import { notify } from "../features/notifications/notify";
// legacy usecases replaced by feature hooks bridges
import { useEditMessage } from "@features/editMessage";
import { useDeleteMessage } from "@features/deleteMessage";
import { useMarkRead } from "@features/markRead";
import { usePinMessage } from "@features/pinMessage";

const useChatMessages = (selectedUser) => {
  // локальный стейт сообщений больше не используем — переходим на прямое чтение из zustand
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const storeSetChatMessages = useMessagesStore((s) => s.setChatMessages);
  // (update/remove/markRead теперь обрабатываются внутри feature хуков)
  const addPending = useMessagesStore((s) => s.addPendingMessage);
  const finalizePending = useMessagesStore((s) => s.finalizePendingMessage);
  const failPending = useMessagesStore((s) => s.failPendingMessage);

  // реактивное чтение сообщений текущего чата напрямую из zustand
  const chatKey = selectedUser?.id ? `private:${selectedUser.id}` : "general";
  // используем useMemo для стабильной пустой ссылки
  const EMPTY = useMemo(() => [], []);
  const reactiveMessages = useMessagesStore(
    (state) => state.chats[chatKey]?.messages ?? EMPTY
  );

  // fetch при смене пользователя (если не загружено)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(selectedUser?.id);
        storeSetChatMessages(selectedUser?.id, data); // reactiveMessages обновится сам
        setError("");
      } catch (error) {
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
      }
    };
    fetchMessages();
  }, [selectedUser, user.id, storeSetChatMessages]);

  // send
  const sendMessageHandler = async (formData) => {
    setLoading(true);
    const text = formData.get("text");
    const file = formData.get("media");
    const receiverId = selectedUser?.id;
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    // optimistic temp message (минимальный набор полей)
    addPending(selectedUser?.id, {
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
      isPinned: false,
      isDeleted: false,
      isEdited: false,
      mediaUrl: null,
      mediaType: null,
      optimistic: true,
    });
    try {
      const res = await sendMessageUsecase({ text, file, receiverId });
      if (!res.ok) {
        failPending(tempId);
        setError(res.error);
        notify("error", res.error, {
          actions: [
            {
              label: "Повторить",
              onClick: () => {
                const retryForm = new FormData();
                if (text) retryForm.append("text", text);
                if (file) retryForm.append("media", file);
                sendMessageHandler(retryForm);
              },
            },
          ],
        });
        return false;
      }
      // финализируем, заменяя temp на реальное сообщение
      finalizePending(tempId, res.value);
      return true;
    } catch (error) {
      failPending(tempId);
      notify("error", "Не удалось отправить сообщение", {
        actions: [
          {
            label: "Повторить",
            onClick: () => {
              const retryForm = new FormData();
              if (text) retryForm.append("text", text);
              if (file) retryForm.append("media", file);
              sendMessageHandler(retryForm);
            },
          },
        ],
      });
      console.error("Ошибка при отправке сообщения:", error);

      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data?.message?.includes("file")) {
              setError(
                "Неверный формат файла. Поддерживаются только изображения и видео"
              );
            } else {
              setError("Некорректные данные сообщения");
            }
            break;
          case 401:
            setError("Требуется авторизация. Пожалуйста, войдите заново");
            break;
          case 403:
            setError("У вас нет прав для отправки сообщений в этот чат");
            break;
          case 404:
            setError("Получатель сообщения не найден");
            break;
          case 413:
            setError(
              "Файл слишком большой. Пожалуйста, выберите файл меньшего размера"
            );
            break;
          case 429:
            setError("Слишком много сообщений. Пожалуйста, подождите немного");
            break;
          default:
            setError("Не удалось отправить сообщение");
        }
      } else if (error.request) {
        setError("Сервер недоступен. Проверьте подключение к интернету");
      } else {
        setError("Ошибка при отправке сообщения");
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  // feature hooks usage
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

  // delete
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
    error,
    setError,
    setMessages: () => {}, // внешнее обновление более не поддерживается напрямую
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
    pinMessageHandler,
  };
};

export default useChatMessages;
