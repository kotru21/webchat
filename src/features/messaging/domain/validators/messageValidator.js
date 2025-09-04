import { INPUT_LIMITS, FILE_LIMITS } from "../../../../constants/appConstants";

export function validateNewMessage({ text, file }) {
  if (!text && !file) {
    return { ok: false, error: `Сообщение не может быть пустым` };
  }
  if (text && text.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Сообщение не может быть длиннее ${INPUT_LIMITS.MESSAGE_MAX_LENGTH} символов`,
    };
  }
  if (file && file.size > FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE) {
    const sizeInMB = FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE / (1024 * 1024);
    return {
      ok: false,
      error: `Файл слишком большой. Максимальный размер: ${sizeInMB} МБ`,
    };
  }
  return { ok: true };
}

export function validateEditMessage({ text, file, removeMedia }) {
  if (!text && !file && removeMedia) {
    return {
      ok: false,
      error: "Сообщение не может быть пустым. Добавьте текст или медиа.",
    };
  }
  if (text && text.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Сообщение не может быть длиннее ${INPUT_LIMITS.MESSAGE_MAX_LENGTH} символов`,
    };
  }
  return { ok: true };
}
