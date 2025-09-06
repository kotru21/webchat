import { memo, useEffect, useRef, useState } from "react";
import NewMessagesButton from "./NewMessagesButton";
import useMessageScroll from "../../../hooks/useMessageScroll";
import useMessageRangeRead from "../../../hooks/useMessageRangeRead";
import { useMessageGrouping } from "@entities/message/lib/useMessageGrouping";
import { PinnedMessagesPanel } from "./PinnedMessagesPanel";
import { MessageVirtualList } from "./MessageVirtualList";

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
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const listRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const indexByMessageIdRef = useRef(new Map());

  const {
    scrollToMessage,
    scrollToBottom,
    newMessagesCount,
    setAtBottomState,
  } = useMessageScroll({
    listRef,
    scrollContainerRef,
    indexByMessageIdRef,
    currentUserId: currentUser.id,
    isTransitioning: false,
  });

  const { flatItems, pinnedMessages } = useMessageGrouping(messages);
  const { handleRangeChanged } = useMessageRangeRead({
    flatItems,
    onMarkAsRead,
  });

  const initialScrolledRef = useRef(false);
  useEffect(() => {
    if (!initialScrolledRef.current && messages.length > 0) {
      scrollToBottom(false);
      initialScrolledRef.current = true;
    }
  }, [messages.length, scrollToBottom]);

  const onItemsRange = ({ startIndex, endIndex }) => {
    handleRangeChanged({ startIndex, endIndex });
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      setAtBottomState(atBottom);
    }
  };

  return (
    // min-h-0 критично внутри flex-колонок родителя для корректного рассчёта высоты и работы overflow
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <PinnedMessagesPanel
        pinnedMessages={pinnedMessages}
        enable={enablePinnedPanel}
        onSelect={(pid) => scrollToMessage(pid)}
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
        onStartChat={onStartChat}
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
