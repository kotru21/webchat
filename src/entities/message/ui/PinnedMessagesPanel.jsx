import { usePinnedMessagesPanel } from "@entities/message/model/usePinnedMessagesPanel";

export const PinnedMessagesPanel = ({
  pinnedMessages,
  showAllPinned,
  setShowAllPinned,
  currentUser,
  scrollToMessage,
  onPinMessage,
}) => {
  const {
    hasPinned,
    count,
    visibleMessages,
    toggleShowAll,
    getSenderName,
    unpin,
  } = usePinnedMessagesPanel({
    pinnedMessages,
    showAllPinned,
    setShowAllPinned,
    currentUserId: currentUser.id,
    scrollToMessage,
    onPinMessage,
  });

  if (!hasPinned) return null;
  return (
    <div className="pinned-panel sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700 shadow-md">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium flex items-center">
            <span className="text-yellow-500 mr-2 transform hover:scale-110 transition-transform">
              📌
            </span>
            Закрепленные сообщения ({count})
          </h3>
          {count > 1 && (
            <button
              onClick={toggleShowAll}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm transition-all duration-200 hover:scale-105">
              {showAllPinned ? "Скрыть" : "Показать все"}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {visibleMessages.map((message) => (
            <div
              key={message._id}
              className="transform transition-all duration-300 ease-out">
              <PinnedMessagePreview
                message={message}
                getSenderName={getSenderName}
                scrollToMessage={scrollToMessage}
                onUnpin={unpin}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessagesPanel;

const PinnedMessagePreview = ({
  message,
  getSenderName,
  scrollToMessage,
  onUnpin,
}) => (
  <div className="w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-lg pinned-message">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <img
          src={
            message.sender.avatar
              ? `${import.meta.env.VITE_API_URL}${message.sender.avatar}`
              : "/default-avatar.png"
          }
          alt="Avatar"
          className="w-6 h-6 rounded-full transition-transform hover:scale-110"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {getSenderName(message)}
          </p>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {message.mediaUrl ? (
              <span className="flex items-center">
                {message.mediaType === "image" ? "🖼️ " : "🎥 "}
                {message.content || "Медиа"}
              </span>
            ) : (
              message.content
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-2">
        <button
          onClick={() => scrollToMessage(message._id)}
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-sm px-2 py-1 rounded hover:bg-gray-400/20 transition-all duration-200 hover:scale-105">
          Перейти
        </button>
        <button
          onClick={() => onUnpin(message._id)}
          className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 text-sm px-2 py-1 rounded hover:bg-gray-400/20 transition-all duration-200 hover:scale-105">
          Открепить
        </button>
      </div>
    </div>
  </div>
);
