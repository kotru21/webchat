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
}) => {
  const [editingMessage, setEditingMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden pb-20">
      {messages.map((message) => (
        <div
          key={message._id}
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
            />
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
