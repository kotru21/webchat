import { memo, useCallback } from "react";
import { useChatStore } from "@shared/store/chatStore";
import { resolvePeerId } from "@shared/lib/peerId";
import NewMessagesButton from "./NewMessagesButton";
import { MessageVirtualList } from "./MessageVirtualList";
import { useMessagesListController } from "@entities/message/model/useMessagesListController";

export const MessagesList = memo(function MessagesList({
  messages,
  currentUser,
  onMediaClick,
  onStartChat,
  ProfileWidgetComponent,
}) {
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);

  const controller = useMessagesListController({
    messages,
    currentUser,
  });

  const {
    flatItems,
    newMessagesCount,
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    scrollToBottom,
    onItemsRange,
  } = controller;

  const handleStartChat = useCallback(
    (user) => {
      const peerId = resolvePeerId(user);
      if (!peerId || peerId === currentUser.id) return;
      setSelectedUser({
        id: peerId,
        username: user.username,
        avatar: user.avatar,
      });
      onStartChat?.({ ...user, id: peerId });
    },
    [currentUser.id, onStartChat, setSelectedUser]
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <MessageVirtualList
        flatItems={flatItems}
        currentUser={currentUser}
        listRef={listRef}
        scrollContainerRef={scrollContainerRef}
        indexByMessageIdRef={indexByMessageIdRef}
        onItemsRange={onItemsRange}
        onMediaClick={onMediaClick}
        onStartChat={handleStartChat}
        ProfileWidgetComponent={ProfileWidgetComponent}
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
