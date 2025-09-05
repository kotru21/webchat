import { memo } from "react";
import ReadStatus from "./ReadStatus";
import UserProfileWidget from "@features/profile/widgets/UserProfileWidget";
import MessageEditor from "@features/editMessage/ui/MessageEditor.jsx";
import MessageMedia from "./MessageMedia.jsx";
import { formatTime } from "@shared/lib/date";
import { useMessageItem } from "@entities/message/model/useMessageItem";

export const MessageItem = memo(function MessageItem({
  message,
  currentUser,
  onDelete,
  onMediaClick,
  onPin,
  isMenuOpen,
  onToggleMenu,
  onSaveEdit,
  onStartChat,
}) {
  const {
    isOwnMessage,
    isEditing,
    startEdit,
    cancelEdit,
    saveEdit,
    togglePin,
    messageRef,
    profileTriggerRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    handleClick,
    messageContentRef,
    isOptimistic,
    isFailed,
  } = useMessageItem({
    message,
    currentUserId: currentUser.id,
    onToggleMenu,
    onPin,
    onSaveEdit,
  });

  const renderMessageContent = () => (
    <div ref={messageContentRef}>
      {message.content && (
        <div className="flex flex-col">
          <p
            className={`text-sm break-words ${
              isOwnMessage ? "text-right" : "text-left"
            } ${message.isDeleted ? "italic text-opacity-70" : ""}`}>
            {message.content}
          </p>
          {(message.isEdited || message.isDeleted) && (
            <span
              className={`text-xs ${
                isOwnMessage
                  ? "text-right text-gray-300"
                  : "text-left text-gray-500"
              }`}>
              {message.isDeleted ? "удалено" : "изменено"}
            </span>
          )}
        </div>
      )}
      <MessageMedia message={message} onMediaClick={onMediaClick} />
    </div>
  );

  if (isEditing) {
    return (
      <div className={`flex justify-${isOwnMessage ? "end" : "start"} w-full`}>
        <div className="max-w-[80%] transition-all duration-300 animate-fade-in">
          <MessageEditor
            message={message}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messageRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } w-full relative`}>
      <div
        className={`max-w-[80%] message-wrapper uniform-message-spacing ${
          message.isPinned ? "pinned-message" : ""
        }`}>
        <div
          className={`absolute flex flex-col gap-2 transition-all duration-300 ease-in-out ${
            isMenuOpen ? "opacity-100 z-20" : "opacity-0 pointer-events-none"
          } bg-white dark:bg-gray-800 py-3 px-4 rounded-md shadow-lg transition-all duration-200 z-10`}
          style={{
            left: isOwnMessage ? "auto" : `${menuPosition.x}px`,
            right: isOwnMessage ? `${menuPosition.x}px` : "auto",
            top: `${menuPosition.y}px`,
          }}>
          {isOwnMessage && (
            <>
              {!message.isDeleted && (
                <button
                  onClick={startEdit}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:hover текст-blue-400">
                  Редактировать
                </button>
              )}
              <button
                onClick={onDelete}
                className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
                Удалить
              </button>
            </>
          )}
          <button
            onClick={togglePin}
            className="text-sm text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400">
            {message.isPinned ? "Открепить" : "Закрепить"}
          </button>
        </div>
        <div
          className={`flex items-start ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } gap-2`}>
          <div className="cursor-pointer flex items-center gap-2">
            <div
              ref={profileTriggerRef}
              onClick={handleProfileClick}
              className="relative">
              <picture>
                <source
                  srcSet={
                    message.sender.avatar
                      ? `${import.meta.env.VITE_API_URL}${
                          message.sender.avatar
                        }`.replace(/(\.[a-zA-Z0-9]+)$/i, ".webp")
                      : "/default-avatar.png"
                  }
                  type="image/webp"
                />
                <img
                  loading="lazy"
                  decoding="async"
                  src={
                    message.sender.avatar
                      ? `${import.meta.env.VITE_API_URL}${
                          message.sender.avatar
                        }`
                      : "/default-avatar.png"
                  }
                  alt={`${
                    message.sender.username || message.sender.email
                  }'s avatar`}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
              </picture>
              {isProfileOpen && (
                <div className="absolute top-0">
                  <UserProfileWidget
                    userId={message.sender._id}
                    onClose={() => setIsProfileOpen(false)}
                    anchorEl={profileTriggerRef.current}
                    isReversed={isOwnMessage}
                    containerClassName={`${
                      isOwnMessage
                        ? "right-full translate-x-[-8px]"
                        : "left-full translate-x-[8px]"
                    }`}
                    currentUserId={currentUser.id}
                    onStartChat={onStartChat}
                  />
                </div>
              )}
            </div>
          </div>
          <div
            className={`rounded-lg px-4 py-2 hover-lift relative ${
              isOwnMessage
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
            } ${isOptimistic ? "opacity-60" : ""} ${
              isFailed ? "ring-2 ring-red-400" : ""
            }`}>
            {isOptimistic && !isFailed && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1 py-[2px] rounded shadow animate-pulse select-none">
                ...
              </span>
            )}
            {isFailed && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1 py-[2px] rounded shadow select-none">
                fail
              </span>
            )}
            <div
              className={`text-sm font-medium mb-1 ${
                isOwnMessage ? "text-right" : "text-left"
              }`}>
              {isOwnMessage
                ? "Вы"
                : message.sender.username || message.sender.email}
            </div>
            {renderMessageContent()}
            <div className="flex flex-row-reverse gap-2 mt-1">
              <span
                className={`text-xs opacity-75 ${
                  isOwnMessage ? "text-right mt-1.5" : "text-left"
                }`}>
                {formatTime(message.createdAt)}
              </span>
              <ReadStatus message={message} currentUser={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
