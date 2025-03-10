import { useState, useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import MessageEditor from "../MessageEditor";

const ChatMessages = ({
  messages,
  currentUser,
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
  onMediaClick,
  onPinMessage,
}) => {
  const [editingMessage, setEditingMessage] = useState(null);
  const [showAllPinned, setShowAllPinned] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const prevMessagesLength = useRef(messages.length);
  const containerRef = useRef(null);

  // Модифицируем функцию scrollToBottom
  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowScrollButton(false);
  };

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    }
  };

  const checkNewMessagesVisibility = () => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 100; // пикселей от нижнего края
    const isNearBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      threshold;

    // Проверяем, есть ли новые сообщения от других пользователей
    const hasNewMessagesFromOthers =
      messages.length > prevMessagesLength.current &&
      messages[messages.length - 1]?.sender._id !== currentUser.id;

    if (!isNearBottom && hasNewMessagesFromOthers) {
      setShowScrollButton(true);
    }
  };

  useEffect(() => {
    checkNewMessagesVisibility();
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser.id]); // Сообщения для прокрутки. Для текущего пользователя не считаем его сообщения

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            const message = messages.find((m) => m._id === messageId);
            if (message) onMarkAsRead(message);
          }
        });
      },
      { threshold: 1.0 }
    );

    const messageElements = document.querySelectorAll(".message-item");
    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
  }, [messages, onMarkAsRead]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const isAtBottom =
      container.scrollHeight - (container.scrollTop + container.clientHeight) <=
      100;

    if (isAtBottom) {
      setShowScrollButton(false);
    }
  };

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  const getSenderName = (message) => {
    return message.sender._id === currentUser.id
      ? "Вы"
      : message.sender.username || message.sender.email;
  };

  const shouldTruncate = (text) => {
    return text && text.length > 50;
  };

  const PinnedMessagePreview = ({ message }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <img
            src={
              message.sender.avatar
                ? `${import.meta.env.VITE_API_URL}${message.sender.avatar}`
                : "/default-avatar.png"
            }
            alt="Avatar"
            className="w-6 h-6 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getSenderName(message)}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
              {message.mediaUrl ? (
                <span className="flex items-center">
                  {message.mediaType === "image" ? "🖼️ " : "🎥 "}
                  {message.content || "Медиа"}
                </span>
              ) : (
                message.content
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={() => scrollToMessage(message._id)}
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm px-2 py-1 rounded hover:bg-gray-400/20">
            Перейти
          </button>
          <button
            onClick={() => onPinMessage(message._id, false)}
            className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 text-sm px-2 py-1 rounded hover:bg-gray-400/20">
            Открепить
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    checkNewMessagesVisibility();
    prevMessagesLength.current = messages.length;
  }, [messages, currentUser.id]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Панель закрепленных сообщений */}
      {pinnedMessages.length > 0 && (
        <div className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 shadow-md">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center">
                <span className="text-yellow-500 mr-2">📌</span>
                Закрепленные сообщения ({pinnedMessages.length})
              </h3>
              {pinnedMessages.length > 1 && (
                <button
                  onClick={() => setShowAllPinned(!showAllPinned)}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm">
                  {showAllPinned ? "Скрыть" : "Показать все"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllPinned
                ? pinnedMessages
                : pinnedMessages.slice(0, 1)
              ).map((message) => (
                <PinnedMessagePreview key={message._id} message={message} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Контейнер сообщений */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 messages-container"
        onScroll={handleScroll}>
        {messages.map((message) => (
          <div
            key={message._id}
            ref={(el) => (messageRefs.current[message._id] = el)}
            data-message-id={message._id}
            className="message-item">
            <MessageItem
              message={message}
              currentUser={currentUser}
              onEdit={() => setEditingMessage(message)}
              onDelete={() => onDeleteMessage(message._id)}
              onMediaClick={onMediaClick}
              onPin={onPinMessage}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2 z-50 animate-bounce">
          <span>↓</span>
          <span>Перейти к новым сообщениям</span>
        </button>
      )}

      {/* Редактор сообщений */}
      {editingMessage && (
        <MessageEditor
          message={editingMessage}
          onSave={async (formData) => {
            await onEditMessage(editingMessage._id, formData);
            setEditingMessage(null);
          }}
          onCancel={() => setEditingMessage(null)}
        />
      )}
    </div>
  );
};

export default ChatMessages;
