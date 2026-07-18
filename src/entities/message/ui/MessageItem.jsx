import { memo, useCallback, useRef } from "react";
import { FiAlertCircle } from "react-icons/fi";
import MessageMedia from "./MessageMedia.jsx";
import { formatTime } from "@shared/lib/date";
import { resolvePeerId } from "@shared/lib/peerId";
import { MessageSenderAvatar } from "./MessageSenderAvatar";

export const MessageItem = memo(function MessageItem({
  message,
  currentUser,
  onMediaClick,
  onOpenProfile,
}) {
  const isOwnMessage = message.sender._id === currentUser.id;
  const isOptimistic =
    message.optimistic || String(message._id).startsWith("temp-");
  const isFailed = message.failed;
  const senderAvatar = message.sender?.avatar || "";
  const senderId = resolvePeerId(message.sender);
  const avatarRef = useRef(null);

  const openProfile = useCallback(() => {
    if (!senderId || !onOpenProfile) return;
    const el = avatarRef.current;
    onOpenProfile({
      userId: senderId,
      anchorRef: avatarRef,
      anchorRect: el?.getBoundingClientRect?.() ?? null,
      isReversed: isOwnMessage,
    });
  }, [isOwnMessage, onOpenProfile, senderId]);

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } w-full`}>
      <div className="max-w-[80%] message-wrapper">
        <div
          className={`flex items-end ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } gap-2`}>
          <MessageSenderAvatar
            ref={avatarRef}
            sender={message.sender}
            senderAvatar={senderAvatar}
            onClick={openProfile}
          />
          <div
            className={`relative rounded-2xl border px-4 py-3 transition-colors duration-200 ${
              isOwnMessage
                ? "border-primary/40 bg-primary text-primary-foreground"
                : "m3-surface-high border-border/70 text-foreground"
            } ${isOptimistic ? "opacity-60" : ""} ${
              isFailed ? "ring-2 ring-destructive/70" : ""
            }`}>
            {isOptimistic && !isFailed && (
              <span className="absolute -right-2 -top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground shadow select-none">
                …
              </span>
            )}
            {isFailed && (
              <span
                className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground shadow select-none"
                role="status">
                <FiAlertCircle size={10} aria-hidden />
                Не отправлено
              </span>
            )}
            <div
              className={`mb-2 text-sm font-medium leading-5 ${
                isOwnMessage ? "text-right" : "text-left"
              }`}>
              {isOwnMessage
                ? "Вы"
                : message.sender.username || "Пользователь"}
            </div>
            <div>
              <p
                className={`text-sm leading-5 wrap-break-word ${
                  isOwnMessage ? "text-right" : "text-left"
                }`}>
                {message.content || ""}
              </p>
              <MessageMedia message={message} onMediaClick={onMediaClick} />
            </div>
            <div className="mt-2 flex flex-row-reverse gap-2">
              <span
                className={`text-xs leading-4 ${
                  isOwnMessage
                    ? "text-right text-primary-foreground/90"
                    : "text-left text-muted-foreground"
                }`}>
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
