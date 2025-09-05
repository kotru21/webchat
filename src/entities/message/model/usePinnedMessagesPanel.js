import { useCallback, useMemo } from "react";

export function usePinnedMessagesPanel({
  pinnedMessages,
  showAllPinned,
  setShowAllPinned,
  currentUserId,
  scrollToMessage,
  onPinMessage,
}) {
  const toggleShowAll = useCallback(
    () => setShowAllPinned((p) => !p),
    [setShowAllPinned]
  );

  const visibleMessages = useMemo(
    () => (showAllPinned ? pinnedMessages : pinnedMessages.slice(0, 1)),
    [pinnedMessages, showAllPinned]
  );

  const getSenderName = useCallback(
    (message) =>
      message.sender._id === currentUserId
        ? "Вы"
        : message.sender.username || message.sender.email,
    [currentUserId]
  );

  const unpin = useCallback(
    async (messageId) => {
      try {
        await onPinMessage(messageId, false);
      } catch (e) {
        console.error(e);
      }
    },
    [onPinMessage]
  );

  return {
    hasPinned: pinnedMessages && pinnedMessages.length > 0,
    count: pinnedMessages?.length || 0,
    visibleMessages,
    showAllPinned,
    toggleShowAll,
    getSenderName,
    scrollToMessage,
    unpin,
  };
}

export default usePinnedMessagesPanel;
