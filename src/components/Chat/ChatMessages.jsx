import { useState, useRef, useEffect, memo, useMemo } from "react";
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
    onStartChat,
  }) => {
    const [showAllPinned, setShowAllPinned] = useState(false);
    const containerRef = useRef(null);
    const messageRefs = useRef({});
    // переходы отключены
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);

    const { scrollToMessage, scrollToBottom, newMessagesCount } =
      useMessageScroll({
        containerRef,
        messageRefs,
        currentUserId: currentUser.id,
        isTransitioning: false,
      });

    useMessageObserver({
      messages,
      onMarkAsRead,
    });

    // chatId теперь приходит извне (упрощение компонента)
    // currentChatId снят — не используется

    // Эффект для анимации при смене чата
    // анимация переключения отключена

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

    // Порядок: ожидаем что массив messages уже в порядке от старых к новым.
    // Раньше был flex-col-reverse + reverse() -> дублирование.
    // Убираем это чтобы корректно работала логика scroll (берёт последний DOM элемент как последний message).

    // Автоскролл при первой загрузке / добавлении сообщений
    const initialScrolledRef = useRef(false);
    useEffect(() => {
      if (!initialScrolledRef.current && messages.length > 0) {
        // мгновенно в конец
        scrollToBottom(false);
        initialScrolledRef.current = true;
      }
    }, [messages.length, scrollToBottom]);

    useEffect(() => {
  });

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
          className={`flex-1 overflow-y-auto py-4 messages-container px-4 md:px-12 lg:px-20 xl:px-24 xl:pr-40`}
          style={{
            transition: "all 0.3s ease-in-out",
          }}
          onClick={handleContainerClick}>
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10 select-none">
              Сообщений пока нет
            </div>
          )}
          {messages.map((message) => {
            const mid = message._id || message.id || message.tempId;
            return (
              <div
                key={mid}
                ref={(el) => (messageRefs.current[mid] = el)}
                data-message-id={mid}
                className="message-item mb-8">
                <MessageItem
                  message={message}
                  currentUser={currentUser}
                  onDelete={() => onDeleteMessage(message._id || message.id)}
                  onMediaClick={onMediaClick}
                  onPin={onPinMessage}
                  isMenuOpen={activeMessageMenu === (message._id || message.id)}
                  onToggleMenu={() => {
                    setActiveMessageMenu(
                      activeMessageMenu === (message._id || message.id)
                        ? null
                        : message._id || message.id
                    );
                  }}
                  onSaveEdit={onEditMessage}
                  onStartChat={onStartChat}
                />
              </div>
            );
          })}
        </div>

        {newMessagesCount > 0 && (
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
