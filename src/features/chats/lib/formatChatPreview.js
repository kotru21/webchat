const PREVIEW_MAX = 25;

/** @param {string} text @param {number} [max] */
export function truncatePreview(text, max = PREVIEW_MAX) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/**
 * Sidebar last-message label. Never returns raw e2ee-v1 envelope JSON.
 * @param {{
 *   content?: string,
 *   contentFormat?: string,
 *   mediaUrl?: string | null,
 *   mediaType?: string | null,
 * }} message
 * @param {{
 *   decryptedText?: string,
 *   decryptFailed?: boolean,
 *   decryptPending?: boolean,
 * }} [e2ee]
 * @returns {"empty" | "image" | "video" | "media" | "e2ee-pending" | "e2ee-locked" | "text"}
 *   kind plus text for text kind
 */
export function resolveChatPreview(message, e2ee = {}) {
  if (!message) {
    return { kind: "empty", text: "Нет сообщений" };
  }
  if (message.mediaUrl) {
    if (message.mediaType === "image") {
      return { kind: "image", text: "Изображение" };
    }
    if (message.mediaType === "video") {
      return { kind: "video", text: "Видео" };
    }
    return { kind: "media", text: "Медиа" };
  }

  const format = message.contentFormat || "plain";
  if (format === "e2ee-v1") {
    if (e2ee.decryptPending) {
      return { kind: "e2ee-pending", text: "…" };
    }
    if (e2ee.decryptFailed || !e2ee.decryptedText) {
      return { kind: "e2ee-locked", text: "Зашифрованное сообщение" };
    }
    return {
      kind: "text",
      text: truncatePreview(e2ee.decryptedText),
    };
  }

  return {
    kind: "text",
    text: truncatePreview(message.content || ""),
  };
}
