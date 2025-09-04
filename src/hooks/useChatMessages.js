import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
} from "../services/api";
import { FILE_LIMITS, INPUT_LIMITS } from "../constants/appConstants";

const useChatMessages = (selectedUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // fetch при смене пользователя
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(selectedUser?.id);
        setMessages(data); // Set original data
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
  }, [selectedUser, user.id]);

  // send
  const sendMessageHandler = async (formData) => {
    setLoading(true);
    try {
      if (selectedUser) formData.append("receiverId", selectedUser.id);

      // валидация содержимого
      const messageText = formData.get("text");
      const messageMedia = formData.get("media");

      if (!messageText && !messageMedia) {
        setError("Сообщение не может быть пустым");
        return false;
      }

      if (messageText && messageText.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
        setError(
          `Сообщение не может быть длиннее ${INPUT_LIMITS.MESSAGE_MAX_LENGTH} символов`
        );
        return false;
      }

      if (
        messageMedia &&
        messageMedia.size > FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE
      ) {
        const sizeInMB = FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE / (1024 * 1024);
        setError(`Файл слишком большой. Максимальный размер: ${sizeInMB} МБ`);
        return false;
      }

      await sendMessage(formData);
      return true;
    } catch (error) {
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

  // mark read
  const markAsReadHandler = async (message) => {
    // проверка условий
    if (
      message &&
      message.sender._id !== user.id &&
      !message.readBy?.some((reader) => reader._id === user.id)
    ) {
      try {
        await markMessageAsRead(message._id);
      } catch (error) {
        console.error("Ошибка при отметке сообщения как прочитанного:", error);
      }
    }
  };

  const editMessageHandler = async (messageId, formData) => {
    try {
      // валидация перед редактированием
      const messageText = formData.get("content");
      const messageMedia = formData.get("media");
      const removeMedia = formData.get("removeMedia") === "true";

      if (!messageText && !messageMedia && removeMedia) {
        setError("Сообщение не может быть пустым. Добавьте текст или медиа.");
        return false;
      }

      if (messageText && messageText.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
        setError(
          `Сообщение не может быть длиннее ${INPUT_LIMITS.MESSAGE_MAX_LENGTH} символов`
        );
        return false;
      }

      const updatedMessage = await updateMessage(messageId, formData);

      // локальное обновление
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? updatedMessage : msg
        )
      );

      return true;
    } catch (error) {
      console.error("Ошибка при редактировании сообщения:", error);

      if (error.response) {
        switch (error.response.status) {
          case 400:
            setError("Некорректные данные для редактирования");
            break;
          case 401:
            setError("Требуется авторизация. Пожалуйста, войдите заново");
            break;
          case 403:
            setError("У вас нет прав для редактирования этого сообщения");
            break;
          case 404:
            setError("Сообщение не найдено");
            break;
          case 413:
            setError(
              "Файл слишком большой. Пожалуйста, выберите файл меньшего размера"
            );
            break;
          case 429:
            setError("Слишком много запросов. Пожалуйста, повторите позже");
            break;
          default:
            setError("Не удалось отредактировать сообщение");
        }
      } else if (error.request) {
        setError("Сервер недоступен. Проверьте подключение к интернету");
      } else {
        setError("Ошибка при редактировании сообщения");
      }

      return false;
    }
  };

  // delete
  const deleteMessageHandler = async (messageId) => {
    try {
      await deleteMessage(messageId);
      // удаление через socket
      return true;
    } catch (error) {
      console.error("Ошибка при удалении сообщения:", error);

      if (error.response) {
        switch (error.response.status) {
          case 401:
            setError("Требуется авторизация. Пожалуйста, войдите заново");
            break;
          case 403:
            setError("У вас нет прав для удаления этого сообщения");
            break;
          case 404:
            setError("Сообщение не найдено или уже удалено");
            break;
          case 429:
            setError("Слишком много запросов. Пожалуйста, повторите позже");
            break;
          default:
            setError("Не удалось удалить сообщение");
        }
      } else if (error.request) {
        setError("Сервер недоступен. Проверьте подключение к интернету");
      } else {
        setError("Ошибка при удалении сообщения");
      }

      return false;
    }
  };

  return {
    messages,
    loading,
    error,
    setError,
    setMessages,
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
  };
};

export default useChatMessages;
