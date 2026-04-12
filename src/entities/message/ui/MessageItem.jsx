import { memo, useCallback } from "react";
import { useChatStore } from "@shared/store/chatStore";
import ReadStatus from "./ReadStatus";
import MessageMedia from "./MessageMedia.jsx";
import { formatTime } from "@shared/lib/date";
import { useMessageItem } from "@entities/message/model/useMessageItem";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";
import { MessageActionsMenu } from "./MessageActionsMenu";
import { MessageSenderAvatar } from "./MessageSenderAvatar";

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
  isEditing,
  onRequestEdit,
  onCancelEdit,
  MessageEditorComponent,
  ProfileWidgetComponent,
}) {
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const {
    isOwnMessage,
    startEdit,
    cancelEdit,
    saveEdit,
    togglePin,
    messageRef,
    profileTriggerRef,
    menuRef,
    isProfileOpen,
    setIsProfileOpen,
    menuPosition,
    handleProfileClick,
    handleContextMenu,
    messageContentRef,
    isOptimistic,
    isFailed,
  } = useMessageItem({
    message,
    currentUserId: currentUser.id,
    onToggleMenu,
    onPin,
    onSaveEdit,
    isMenuOpen,
    isEditing,
    onRequestEdit,
    onCancelEdit,
  });

  const renderMessageContent = () => (
    <div ref={messageContentRef}>
      <div className="flex flex-col">
        <p
          className={`text-sm wrap-break-word ${
            isOwnMessage ? "text-right" : "text-left"
          } ${message.isDeleted ? "italic opacity-70" : ""}`}>
          {message.isDeleted ? "Сообщение удалено" : message.content || ""}
        </p>
        {message.isEdited && !message.isDeleted && (
          <span
            className={`text-xs ${
              isOwnMessage
                ? "text-right text-primary-foreground/70"
                : "text-left text-muted-foreground"
            }`}>
            изменено
          </span>
        )}
      </div>
      <MessageMedia message={message} onMediaClick={onMediaClick} />
    </div>
  );

  const handleStartChat = useCallback(
    (targetUser) => {
      if (onStartChat) {
        onStartChat(targetUser);
        return;
      }

      if (!targetUser || targetUser.id === currentUser.id) {
        return;
      }

      setSelectedUser({
        id: targetUser.id,
        username: targetUser.username,
        avatar: targetUser.avatar,
        email: targetUser.email,
      });
    },
    [currentUser.id, onStartChat, setSelectedUser]
  );

  if (isEditing) {
    const Editor = MessageEditorComponent;
    return (
      <div className={`flex justify-${isOwnMessage ? "end" : "start"} w-full`}>
        <div className="max-w-[80%] transition-all duration-300 animate-fade-in">
          {Editor ? (
            <Editor message={message} onSave={saveEdit} onCancel={cancelEdit} />
          ) : null}
        </div>
      </div>
    );
  }

  const senderAvatar =
    toAbsoluteMediaUrl(message.sender?.avatar) || "/default-avatar.png";
  const ProfileWidget = ProfileWidgetComponent;

  return (
    <div
      ref={messageRef}
      onContextMenu={handleContextMenu}
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } w-full relative ${isProfileOpen ? "z-50" : "z-0"}`}>
      <div
        className={`max-w-[80%] message-wrapper ${
          message.isPinned ? "transition-all duration-300 ease-in-out" : ""
        }`}>
        <MessageActionsMenu
          menuRef={menuRef}
          isMenuOpen={isMenuOpen}
          isOwnMessage={isOwnMessage}
          menuPosition={menuPosition}
          isDeleted={message.isDeleted}
          isPinned={message.isPinned}
          onStartEdit={startEdit}
          onDelete={() => onDelete?.(message._id)}
          onTogglePin={togglePin}
        />
        <div
          className={`flex items-start ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } gap-2`}>
          <MessageSenderAvatar
            sender={message.sender}
            senderAvatar={senderAvatar}
            isOwnMessage={isOwnMessage}
            profileTriggerRef={profileTriggerRef}
            isProfileOpen={isProfileOpen}
            onProfileClick={handleProfileClick}
            onCloseProfile={() => setIsProfileOpen(false)}
            ProfileWidgetComponent={ProfileWidget}
            currentUserId={currentUser.id}
            onStartChat={handleStartChat}
          />
          <div
            className={`relative rounded-[1.1rem] border px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              isOwnMessage
                ? "border-primary/40 bg-primary text-primary-foreground"
                : "m3-surface-high border-border/70 text-foreground"
            } ${isOptimistic ? "opacity-60" : ""} ${
              isFailed ? "ring-2 ring-red-400" : ""
            }`}>
            {isOptimistic && !isFailed && (
              <span className="absolute -right-2 -top-2 rounded bg-primary px-1 py-0.5 text-[10px] text-primary-foreground shadow animate-pulse select-none">
                ...
              </span>
            )}
            {isFailed && (
              <span className="absolute -right-2 -top-2 rounded bg-red-500 px-1 py-0.5 text-[10px] text-white shadow select-none">
                fail
              </span>
            )}
            <div
              className={`mb-1 text-sm font-medium ${
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
