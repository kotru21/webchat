/**
 * Форматирует текст, преобразуя URL в кликабельные ссылки
 * @param {string} text - Исходный текст
 * @returns {string} HTML-форматированный текст
 */
export const formatLinkifiedText = (text) => {
  if (!text) return "";

  // Паттерн для распознавания URL
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

  // Заменяем URL на ссылки HTML
  let linkedText = text.replace(
    urlPattern,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
  );

  // Заменяем переносы строк на <br> теги
  linkedText = linkedText.replace(/\n/g, "<br>");

  return linkedText;
};

/**
 * Проверяет, является ли текст URL-адресом
 * @param {string} text - Текст для проверки
 * @returns {boolean} true, если текст является URL
 */
export const isUrl = (text) => {
  const urlPattern = /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])$/;
  return urlPattern.test(text);
};

/**
 * Форматирует текст для безопасного отображения
 * @param {string} text - Исходный текст
 * @returns {string} Безопасный HTML
 */
export const sanitizeText = (text) => {
  if (!text) return "";

  // Эскейпим HTML-теги
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Полное форматирование текста с эскейпингом и добавлением ссылок
 * @param {string} text - Исходный текст
 * @returns {string} Безопасный HTML с ссылками
 */
export const formatAndSanitizeText = (text) => {
  if (!text) return "";

  // Сначала эскейпим HTML, затем добавляем ссылки
  const sanitized = sanitizeText(text);

  // Добавляем ссылки
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  let linkedText = sanitized.replace(
    urlPattern,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
  );

  // Заменяем переносы строк
  linkedText = linkedText.replace(/\n/g, "<br>");

  return linkedText;
};
