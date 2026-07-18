import { memo, useCallback, useState } from "react";
import NewMessagesButton from "./NewMessagesButton";
import { MessageVirtualList } from "./MessageVirtualList";
import { useMessagesListController } from "@entities/message/model/useMessagesListController";

export const MessagesList = memo(function MessagesList({
  messages,
  currentUser,
  onMediaClick,
  ProfileWidgetComponent,
}) {
  const [openProfile, setOpenProfile] = useState(null);

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

  const handleOpenProfile = useCallback((next) => {
    setOpenProfile((prev) => {
      if (prev?.userId === next.userId) {
        return null;
      }
      return next;
    });
  }, []);

  const handleCloseProfile = useCallback(() => {
    setOpenProfile(null);
  }, []);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      role="log"
      aria-label="Сообщения"
      aria-relevant="additions">
      <MessageVirtualList
        flatItems={flatItems}
        currentUser={currentUser}
        listRef={listRef}
        scrollContainerRef={scrollContainerRef}
        indexByMessageIdRef={indexByMessageIdRef}
        onItemsRange={onItemsRange}
        onMediaClick={onMediaClick}
        onOpenProfile={handleOpenProfile}
      />
      {newMessagesCount > 0 && (
        <NewMessagesButton
          count={newMessagesCount}
          onClick={() => scrollToBottom()}
        />
      )}
      {openProfile && ProfileWidgetComponent ? (
        <ProfileWidgetComponent
          userId={openProfile.userId}
          anchorRef={openProfile.anchorRef}
          anchorRect={openProfile.anchorRect}
          isReversed={openProfile.isReversed}
          currentUserId={currentUser.id}
          onClose={handleCloseProfile}
        />
      ) : null}
    </div>
  );
});
