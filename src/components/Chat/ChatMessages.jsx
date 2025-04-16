import React, { useState, useRef, useEffect, memo, useMemo } from "react";
import MessageItem from "./MessageItem";
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
    onStartChat, // Добавляем проп для обработки начала чата
  }) => {
    const [showAllPinned, setShowAllPinned] = useState(false);
    const containerRef = useRef(null);
    const messageRefs = useRef({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevChatId = useRef(null);
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);

    const { scrollToMessage, scrollToBottom, newMessagesCount } =
      useMessageScroll({
        containerRef,
        messageRefs,
        currentUserId: currentUser.id,
        isTransitioning,
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

    // обработчик меню сообщения для мобильной версии
    const handleContainerClick = (e) => {
      if (e.target === containerRef.current) {
        setActiveMessageMenu(null);
      }
    };

    const pinnedMessages = useMemo(
      () => messages.filter((msg) => msg.isPinned),
      [messages]
    );

    const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div
          className={`transform transition-all duration-300 ease-in-out ${
            pinnedMessages.length > 0 ? "translate-y-0" : "-translate-y-full"
          }`}>
          <PinnedMessagesPanel
            pinnedMessages={pinnedMessages}
            showAllPinned={showAllPinned}
            setShowAllPinned={setShowAllPinned}
            currentUser={currentUser}
            scrollToMessage={scrollToMessage}
            onPinMessage={onPinMessage}
          />
        </div>

        <div
          ref={containerRef}
          className={`flex-1 overflow-y-auto py-4 space-y-8 messages-container flex flex-col-reverse chat-content-transition 
          px-4 
          md:px-12 
          lg:px-20 
          xl:px-24 xl:pr-40
          ${isTransitioning ? "chat-content-hidden" : "chat-content-visible"}`}
          style={{
            transition: "all 0.3s ease-in-out",
          }}
          onClick={handleContainerClick}>
          {reversedMessages.map((message) => (
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
                onDelete={() => onDeleteMessage(message._id)}
                onMediaClick={onMediaClick}
                onPin={onPinMessage}
                isMenuOpen={activeMessageMenu === message._id}
                onToggleMenu={() => {
                  setActiveMessageMenu(
                    activeMessageMenu === message._id ? null : message._id
                  );
                }}
                onSaveEdit={onEditMessage}
                onStartChat={onStartChat} // Передаем обработчик начала чата
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
      </div>
    );
  }
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
