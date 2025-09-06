import { memo, useState, useCallback } from "react";
import { useChatStore } from "@shared/store/chatStore";
import NewMessagesButton from "./NewMessagesButton";
import { PinnedMessagesPanel } from "./PinnedMessagesPanel";
import { MessageVirtualList } from "./MessageVirtualList";
import { useMessagesListController } from "@entities/message/model/useMessagesListController";
import { usePinnedMessagesPanel } from "@entities/message/model/usePinnedMessagesPanel";

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
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);

  const controller = useMessagesListController({
    messages,
    currentUser,
    onMarkAsRead,
  });

  const {
    flatItems,
    pinnedMessages,
    newMessagesCount,
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    activeMessageMenu,
    setActiveMessageMenu,
    scrollToMessage,
    scrollToBottom,
    onItemsRange,
  } = controller;

  const [showAllPinned, setShowAllPinned] = useState(false);
  const { toggleShowAll } = usePinnedMessagesPanel({
    pinnedMessages,
    showAllPinned,
    setShowAllPinned,
    currentUserId: currentUser.id,
    scrollToMessage,
    onPinMessage,
  });

  const handleStartChat = useCallback(
    (user) => {
      if (!user || user.id === currentUser.id) return;
      setSelectedUser({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        status: user.status,
      });
      onStartChat?.(user);
    },
    [currentUser.id, onStartChat, setSelectedUser]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <PinnedMessagesPanel
        pinnedMessages={pinnedMessages}
        enable={enablePinnedPanel}
        onSelect={(pid) => scrollToMessage(pid)}
        showAll={showAllPinned}
        onToggleShowAll={toggleShowAll}
      />
      <MessageVirtualList
        flatItems={flatItems}
        currentUser={currentUser}
        listRef={listRef}
        scrollContainerRef={scrollContainerRef}
        indexByMessageIdRef={indexByMessageIdRef}
        onItemsRange={onItemsRange}
        onDeleteMessage={onDeleteMessage}
        onEditMessage={onEditMessage}
        onMediaClick={onMediaClick}
        onPinMessage={onPinMessage}
        onStartChat={handleStartChat}
        activeMessageMenu={activeMessageMenu}
        setActiveMessageMenu={setActiveMessageMenu}
      />
      {newMessagesCount > 0 && (
        <NewMessagesButton
          count={newMessagesCount}
          onClick={() => scrollToBottom()}
        />
      )}
    </div>
  );
});
