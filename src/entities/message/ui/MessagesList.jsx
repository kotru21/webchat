import { memo, useEffect, useMemo, useRef, useState } from "react";
import { formatMessageDay } from "@shared/lib/date";
import { MessageItem } from "./MessageItem";
import PinnedMessagesPanel from "./PinnedMessagesPanel";
import NewMessagesButton from "./NewMessagesButton";
import useMessageScroll from "../../../hooks/useMessageScroll";
import useMessageObserver from "../../../hooks/useMessageObserver";

export const MessagesList = memo(function MessagesList({
  messages,
  currentUser,
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
  onMediaClick,
  onPinMessage,
  onStartChat,
  enablePinnedPanel = true,
}) {
  const [showAllPinned, setShowAllPinned] = useState(false);
  const containerRef = useRef(null);
  const messageRefs = useRef({});
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);

  const { scrollToMessage, scrollToBottom, newMessagesCount } =
    useMessageScroll({
      containerRef,
      messageRefs,
      currentUserId: currentUser.id,
      isTransitioning: false,
    });

  useMessageObserver({ messages, onMarkAsRead });

  const handleContainerClick = (e) => {
    if (e.target === containerRef.current) setActiveMessageMenu(null);
  };

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.isPinned),
    [messages]
  );

  const initialScrolledRef = useRef(false);
  useEffect(() => {
    if (!initialScrolledRef.current && messages.length > 0) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
    }
  }, [messages.length, scrollToBottom]);

  // Группировка по дням
  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const dayKey = formatMessageDay(m.createdAt);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {enablePinnedPanel && (
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
      )}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto py-4 messages-container px-4 md:px-12 lg:px-20 xl:px-24 xl:pr-40"
        style={{ transition: "all 0.3s ease-in-out" }}
        onClick={handleContainerClick}>
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10 select-none">
            Сообщений пока нет
          </div>
        )}
        {grouped.map(([day, dayMessages]) => (
          <div key={day} className="mb-10 relative">
            <div className="sticky top-0 z-10 flex justify-center my-2">
              <span className="px-4 py-1 text-xs font-medium bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-sm select-none backdrop-blur-sm bg-opacity-70 dark:bg-opacity-50">
                {day}
              </span>
            </div>
            {dayMessages.map((message) => {
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
                    isMenuOpen={
                      activeMessageMenu === (message._id || message.id)
                    }
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
        ))}
      </div>
      {newMessagesCount > 0 && (
        <NewMessagesButton
          count={newMessagesCount}
          onClick={() => scrollToBottom()}
        />
      )}
    </div>
  );
});
