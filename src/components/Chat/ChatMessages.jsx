import React, { useState, useRef, useEffect } from "react";
import MessageItem from "./MessageItem";
import MessageEditor from "../MessageEditor";
import PinnedMessagesPanel from "./PinnedMessagesPanel";
import NewMessagesButton from "./NewMessagesButton";
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
  const lastMessageRef = useRef(null);

  const {
    scrollToMessage,
    scrollToBottom,
    handleNewMessage,
    newMessagesCount,
    isAtBottom,
  } = useMessageScroll({
    containerRef,
    messageRefs,
    currentUserId: currentUser.id,
  });

  useMessageObserver({
    messages,
    onMarkAsRead,
  });

  // Отслеживаем только новые непрочитанные сообщения
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Проверяем, что сообщение не прочитано текущим пользователем
      const isUnread = !lastMessage.readBy?.some(
        (reader) => reader._id === currentUser.id
      );
      if (lastMessageRef.current !== lastMessage._id && isUnread) {
        handleNewMessage(lastMessage);
        lastMessageRef.current = lastMessage._id;
      }
    }
  }, [messages, currentUser.id]);

  // скролл вниз при первой загрузке
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <PinnedMessagesPanel
        pinnedMessages={pinnedMessages}
        showAllPinned={showAllPinned}
        setShowAllPinned={setShowAllPinned}
        currentUser={currentUser}
        scrollToMessage={scrollToMessage}
        onPinMessage={onPinMessage}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 messages-container flex flex-col-reverse">
        {[...messages].reverse().map((message) => (
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
      </div>

      {newMessagesCount > 0 && (
        <NewMessagesButton
          count={newMessagesCount}
          onClick={() => scrollToBottom()}
        />
      )}

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
