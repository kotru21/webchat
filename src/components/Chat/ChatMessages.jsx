import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import MessageItem from "./MessageItem";
import MessageEditor from "../MessageEditor";
import PinnedMessagesPanel from "./PinnedMessagesPanel";
import NewMessagesButton from "./NewMessagesButton";
import useMessageScroll from "../../hooks/useMessageScroll";
import useMessageObserver from "../../hooks/useMessageObserver";

const ChatMessages = memo(
  ({
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
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevChatId = useRef(null);

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

    // Определяем ID текущего чата
    const currentChatId =
      messages[0]?.sender._id === currentUser.id
        ? messages[0]?.receiver
        : messages[0]?.sender._id;

    // Эффект для анимации при смене чата
    useEffect(() => {
      if (prevChatId.current !== currentChatId) {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
        prevChatId.current = currentChatId;
        return () => clearTimeout(timer);
      }
    }, [currentChatId]);

    const pinnedMessages = useMemo(
      () => messages.filter((msg) => msg.isPinned),
      [messages]
    );

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
          className={`flex-1 overflow-y-auto p-4 space-y-4 messages-container flex flex-col-reverse chat-content-transition ${
            isTransitioning ? "chat-content-hidden" : "chat-content-visible"
          }`}>
          {[...messages].reverse().map((message) => (
            <div
              key={message._id}
              ref={(el) => (messageRefs.current[message._id] = el)}
              data-message-id={message._id}
              className="message-item"
              style={{
                opacity: isTransitioning ? 0 : 1,
                transform: `translateY(${isTransitioning ? "10px" : "0"})`,
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}>
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

        {!isTransitioning && newMessagesCount > 0 && (
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
  }
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
