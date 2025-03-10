import React, { useState, useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import MessageEditor from "../MessageEditor";
import PinnedMessagesPanel from "./PinnedMessagesPanel";
import ScrollToBottomButton from "./ScrollToBottomButton";
import useMessageScroll from "../../hooks/useMessageScroll";
import useMessageObserver from "../../hooks/useMessageObserver";

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
  const containerRef = useRef(null);
  const messageRefs = useRef({});

  const { showScrollButton, scrollToBottom, scrollToMessage, handleScroll } =
    useMessageScroll({
      containerRef,
      messageRefs,
      messages,
      currentUser,
    });

  // Используем хук для наблюдения за сообщениями
  useMessageObserver({
    messages,
    onMarkAsRead,
  });

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Панель закрепленных сообщений */}
      <PinnedMessagesPanel
        pinnedMessages={pinnedMessages}
        showAllPinned={showAllPinned}
        setShowAllPinned={setShowAllPinned}
        currentUser={currentUser}
        scrollToMessage={scrollToMessage}
        onPinMessage={onPinMessage}
      />

      {/* Контейнер сообщений */}
      <MessagesContainer
        ref={containerRef}
        onScroll={handleScroll}
        messages={messages}
        messageRefs={messageRefs}
        currentUser={currentUser}
        onEdit={setEditingMessage}
        onDelete={onDeleteMessage}
        onMediaClick={onMediaClick}
        onPin={onPinMessage}
      />

      {/* Кнопка прокрутки вниз */}
      <ScrollToBottomButton
        show={showScrollButton}
        onClick={() => scrollToBottom()}
      />

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

// Компонент контейнера сообщений
const MessagesContainer = React.forwardRef(
  (
    {
      onScroll,
      messages,
      messageRefs,
      currentUser,
      onEdit,
      onDelete,
      onMediaClick,
      onPin,
    },
    ref
  ) => (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto p-4 space-y-4 messages-container flex flex-col-reverse"
      onScroll={onScroll}>
      {[...messages].reverse().map((message) => (
        <div
          key={message._id}
          ref={(el) => (messageRefs.current[message._id] = el)}
          data-message-id={message._id}
          className="message-item">
          <MessageItem
            message={message}
            currentUser={currentUser}
            onEdit={() => onEdit(message)}
            onDelete={() => onDelete(message._id)}
            onMediaClick={onMediaClick}
            onPin={onPin}
          />
        </div>
      ))}
    </div>
  )
);

MessagesContainer.displayName = "MessagesContainer";

export default ChatMessages;
