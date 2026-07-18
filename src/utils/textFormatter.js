/**
 * Escapes HTML entities for safe embedding in markup.
 * @param {string} text
 * @returns {string}
 */
export const sanitizeText = (text) => {
  if (!text) return "";

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * @param {string} text
 * @returns {boolean}
 */
export const isUrl = (text) => {
  const urlPattern = /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])$/;
  return urlPattern.test(text);
};

/**
 * Escape first, then linkify — never build HTML from raw user text.
 * @param {string} text
 * @returns {string}
 */
export const formatAndSanitizeText = (text) => {
  if (!text) return "";

  const sanitized = sanitizeText(text);
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  let linkedText = sanitized.replace(
    urlPattern,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
  );

  linkedText = linkedText.replace(/\n/g, "<br>");

  return linkedText;
};
