import { memo } from "react";
import MessageMedia from "./MessageMedia.jsx";
import { formatTime } from "@shared/lib/date";
import { MessageSenderAvatar } from "./MessageSenderAvatar";

export const MessageItem = memo(function MessageItem({
  message,
  currentUser,
  onMediaClick,
}) {
  const isOwnMessage = message.sender._id === currentUser.id;
  const isOptimistic =
    message.optimistic || String(message._id).startsWith("temp-");
  const isFailed = message.failed;
  const senderAvatar = message.sender?.avatar || "";

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } w-full relative`}>
      <div className="max-w-[80%] message-wrapper">
        <div
          className={`flex items-end ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } gap-2`}>
          <MessageSenderAvatar
            sender={message.sender}
            senderAvatar={senderAvatar}
          />
          <div
            className={`relative rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
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
                className={`text-xs leading-4 opacity-75 ${
                  isOwnMessage ? "text-right" : "text-left"
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
