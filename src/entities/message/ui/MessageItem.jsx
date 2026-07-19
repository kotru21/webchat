import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiLock, FiRefreshCw, FiX } from "react-icons/fi";
import MessageMedia from "./MessageMedia.jsx";
import { formatTime } from "@shared/lib/date";
import { resolvePeerId } from "@shared/lib/peerId";
import { MessageSenderAvatar } from "./MessageSenderAvatar";
import { useDecryptedContent } from "@features/e2ee/model/useDecryptedContent.js";
import {
  claimMessageEnterAnimation,
  transferMessageEnterClaim,
} from "@entities/message/lib/claimMessageEnterAnimation.js";
import { useMessagesStore } from "@shared/store/messagesStore";
import { useSendMessage } from "@features/sendMessage/model/useSendMessage";
import { Button } from "@shared/ui/button";

function FailedMessageActions({ message }) {
  const removeMessage = useMessagesStore((s) => s.removeMessage);
  const receiverId =
    typeof message.receiver === "object"
      ? resolvePeerId(message.receiver)
      : message.receiver;
  const { send, loading } = useSendMessage({ receiverId });

  const canRetry =
    !message.mediaType &&
    Boolean(message.localPlaintext || (message.content && message.content !== "Медиа"));

  const discard = useCallback(() => {
    removeMessage(message._id);
  }, [message._id, removeMessage]);

  const retry = useCallback(async () => {
    const text = message.localPlaintext || message.content || "";
    removeMessage(message._id);
    await send({ text });
  }, [message, removeMessage, send]);

  return (
    <div className="mt-2 flex flex-wrap justify-end gap-2">
      {canRetry ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 gap-1.5 border border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
          disabled={loading}
          aria-busy={loading}
          onClick={retry}
          aria-label="Повторить отправку">
          <FiRefreshCw size={14} aria-hidden />
          Повторить
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 gap-1.5 text-primary-foreground hover:bg-primary-foreground/15"
        onClick={discard}
        aria-label="Удалить неотправленное сообщение">
        <FiX size={14} aria-hidden />
        Удалить
      </Button>
    </div>
  );
}

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
  const messageIdRef = useRef(message._id);
  const { text, failed: decryptFailed, isE2ee } = useDecryptedContent(
    message,
    currentUser
  );

  const [playEnter] = useState(() =>
    claimMessageEnterAnimation(message._id, {
      optimistic: isOptimistic,
      createdAt: message.createdAt,
    })
  );

  useEffect(() => {
    const prev = messageIdRef.current;
    const next = message._id;
    if (prev !== next) {
      transferMessageEnterClaim(prev, next);
      messageIdRef.current = next;
    }
  }, [message._id]);

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

  const bodyText = decryptFailed
    ? "Не удалось расшифровать (сообщение с другого устройства?)"
    : text;

  const enterClass =
    playEnter && !isFailed
      ? isOwnMessage
        ? "motion-safe:animate-message-in-own"
        : "motion-safe:animate-message-in-peer"
      : "";

  return (
    <div
      className={`flex ${
        isOwnMessage ? "justify-end" : "justify-start"
      } w-full`}>
      <div className={`max-w-[80%] message-wrapper ${enterClass}`}>
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
            className={`message-bubble relative rounded-2xl border px-4 py-3 ${
              isOwnMessage
                ? "border-primary/40 bg-primary text-primary-foreground"
                : "m3-surface-high border-border/70 text-foreground"
            } ${
              isOptimistic && !isFailed
                ? "message-bubble--optimistic"
                : "message-bubble--confirmed"
            } ${isFailed ? "ring-2 ring-destructive/70" : ""}`}>
            {isE2ee && !decryptFailed && (
              <span
                className="absolute -left-2 -top-2 inline-flex items-center rounded bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground shadow select-none"
                title="Зашифровано"
                role="img"
                aria-label="Зашифровано"
                data-testid="e2ee-lock-badge">
                <FiLock size={10} aria-hidden />
              </span>
            )}
            {isOptimistic && !isFailed && (
              <span
                className="absolute -right-2 -top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground shadow select-none motion-safe:animate-sending-pulse"
                aria-label="Отправляется"
                role="status">
                …
              </span>
            )}
            {isFailed && (
              <span
                className="absolute -right-2 -top-2 inline-flex items-center gap-1 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground shadow select-none motion-safe:animate-fade-in"
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
                } ${decryptFailed ? "italic opacity-80" : ""}`}>
                {bodyText || ""}
              </p>
              <MessageMedia message={message} onMediaClick={onMediaClick} />
            </div>
            {isFailed && isOwnMessage ? (
              <FailedMessageActions message={message} />
            ) : null}
            <div className="mt-2 flex flex-row-reverse gap-2">
              <span
                className={`text-xs leading-5 ${
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
