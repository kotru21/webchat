// src/components/Chat/ChatMessages.jsx
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
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const prevMessagesLength = useRef(messages.length);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (messageId) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Сохранение позиции скролла только для новых сообщений
  useEffect(() => {
    const chatContainer = document.querySelector(".overflow-y-auto");
    const shouldScrollToBottom =
      prevMessagesLength.current < messages.length && // Только при добавлении нового сообщения
      chatContainer.scrollTop + chatContainer.clientHeight >=
        chatContainer.scrollHeight - 50; // Близко к низу

    if (shouldScrollToBottom) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

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

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  const getSenderName = (message) => {
    return message.sender._id === currentUser.id
      ? "Вы"
      : message.sender.username || message.sender.email;
  };

  const shouldTruncate = (text) => {
    return text && text.length > 50; // Точки добавляем только для длинных сообщений
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {pinnedMessages.length > 0 && (
        <div className="absolute  top-0 left-0 z-20 bg-gray-100 dark:bg-gray-800 p-4 border-b dark:border-gray-700 shadow-md ">
          <div className="flex items-center justify-between ">
            <div className="flex-1 overflow-hidden">
              {pinnedMessages.slice(0, 1).map((message) => (
                <div
                  key={message._id}
                  className="w-full bg-gray-200 dark:bg-gray-700 p-2 rounded-lg flex items-center justify-between">
                  <span
                    className={`text-sm flex-1 ${
                      shouldTruncate(message.content) ? "truncate" : ""
                    }`}>
                    <span className="font-medium">
                      {getSenderName(message)}:{" "}
                    </span>
                    {message.content || "Медиа-сообщение"}
                    {shouldTruncate(message.content) && "..."}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToMessage(message._id);
                    }}
                    className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs flex-shrink-0">
                    Перейти
                  </button>
                </div>
              ))}
              {showAllPinned && (
                <div className="p-4 absolute top-full  bg-gray-100 dark:bg-gray-800 max-h-40 overflow-y-auto border-t dark:border-gray-700 shadow-lg mt-1">
                  {pinnedMessages.slice(1).map((message) => (
                    <div
                      key={message._id}
                      className="w-full bg-gray-200 dark:bg-gray-700 p-2 rounded-lg mt-2 flex items-center justify-between">
                      <span
                        className={`text-sm flex-1 ${
                          shouldTruncate(message.content) ? "truncate" : ""
                        }`}>
                        <span className="font-medium">
                          {getSenderName(message)}:{" "}
                        </span>
                        {message.content || "Медиа-сообщение"}
                        {shouldTruncate(message.content) && "..."}
                      </span>
                      <button
                        onClick={() => scrollToMessage(message._id)}
                        className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs flex-shrink-0">
                        Перейти
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {pinnedMessages.length > 1 && (
              <button
                onClick={() => setShowAllPinned(!showAllPinned)}
                className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm flex-shrink-0">
                {showAllPinned ? "Скрыть" : `Ещё ${pinnedMessages.length - 1}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Прокручиваемая область для всех сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            ref={(el) => (messageRefs.current[message._id] = el)}
            data-message-id={message._id}
            className={`flex message-item ${
              message.sender._id === currentUser.id
                ? "justify-end"
                : "justify-start"
            }`}>
            {editingMessage?._id === message._id ? (
              <MessageEditor
                message={message}
                onSave={(formData) => {
                  onEditMessage(message._id, formData);
                  setEditingMessage(null);
                }}
                onCancel={() => setEditingMessage(null)}
              />
            ) : (
              <MessageItem
                message={message}
                currentUser={currentUser}
                onEdit={() => setEditingMessage(message)}
                onDelete={() => onDeleteMessage(message._id)}
                onMediaClick={onMediaClick}
                onPin={onPinMessage}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatMessages;
