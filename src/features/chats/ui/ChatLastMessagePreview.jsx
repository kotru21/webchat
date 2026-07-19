import { memo } from "react";
import { FiImage, FiLock, FiVideo } from "react-icons/fi";
import { useAuth } from "@context/useAuth";
import { useDecryptedContent } from "@features/e2ee/model/useDecryptedContent.js";
import { resolveChatPreview } from "@features/chats/lib/formatChatPreview.js";

/**
 * Sidebar last-message line. Decrypts e2ee-v1 when possible; never shows envelope JSON.
 */
export const ChatLastMessagePreview = memo(function ChatLastMessagePreview({
  lastMessage,
}) {
  const { user } = useAuth();
  const { text, failed, pending, isE2ee } = useDecryptedContent(
    lastMessage,
    user
  );
  const preview = resolveChatPreview(lastMessage, {
    decryptedText: text,
    decryptFailed: failed,
    decryptPending: pending,
  });

  if (preview.kind === "image") {
    return (
      <span className="inline-flex items-center gap-1">
        <FiImage size={12} aria-hidden className="shrink-0" />
        {preview.text}
      </span>
    );
  }
  if (preview.kind === "video") {
    return (
      <span className="inline-flex items-center gap-1">
        <FiVideo size={12} aria-hidden className="shrink-0" />
        {preview.text}
      </span>
    );
  }
  if (preview.kind === "e2ee-locked" || (isE2ee && preview.kind === "e2ee-pending")) {
    return (
      <span className="inline-flex items-center gap-1">
        <FiLock size={12} aria-hidden className="shrink-0" />
        {preview.text}
      </span>
    );
  }

  return preview.text;
});
