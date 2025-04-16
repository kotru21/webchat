import { useState, useRef, useEffect } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { FILE_LIMITS, INPUT_LIMITS } from "../constants/appConstants";

const MessageEditor = ({ message, onSave, onCancel }) => {
  const [content, setContent] = useState(message.content || "");
  const [newMedia, setNewMedia] = useState(null);
  const [keepOriginalMedia, setKeepOriginalMedia] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(
    message.mediaUrl
      ? `${import.meta.env.VITE_API_URL}${message.mediaUrl}`
      : null
  );
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Автоматически скрывать сообщение об ошибке после 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE) {
      setError(
        `Файл слишком большой. Максимальный размер: ${
          FILE_LIMITS.MESSAGE_MEDIA_MAX_SIZE / (1024 * 1024)
        }MB`
      );
      fileInputRef.current.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Неподдерживаемый формат файла. Разрешены только изображения (JPEG, PNG, GIF) и видео (MP4, WebM)."
      );
      fileInputRef.current.value = "";
      return;
    }

    setNewMedia(file);
    setKeepOriginalMedia(false);

    if (previewUrl && !previewUrl.includes(import.meta.env.VITE_API_URL)) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !previewUrl) {
      setError("Сообщение не может быть пустым. Добавьте текст или медиа.");
      return;
    }

    if (content.length > INPUT_LIMITS.MESSAGE_MAX_LENGTH) {
      setError(
        `Сообщение слишком длинное. Максимальная длина: ${INPUT_LIMITS.MESSAGE_MAX_LENGTH} символов`
      );
      return;
    }

    const formData = new FormData();
    formData.append("content", content);

    if (newMedia) {
      formData.append("media", newMedia);
    }

    if (!keepOriginalMedia && !newMedia) {
      formData.append("removeMedia", "true");
    }

    try {
      await onSave(formData);

      // Очищаем URL объекты
      if (previewUrl && !previewUrl.includes(import.meta.env.VITE_API_URL)) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (error.response?.status === 429) {
        setError(
          "Вы редактируете сообщения слишком часто. Пожалуйста, подождите немного."
        );
      } else if (error.response?.status === 413) {
        setError("Файл слишком большой для загрузки на сервер.");
      } else {
        setError(
          "Не удалось сохранить изменения. Пожалуйста, попробуйте позже."
        );
      }
    }
  };

  const handleRemoveMedia = () => {
    if (previewUrl && !previewUrl.includes(import.meta.env.VITE_API_URL)) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setNewMedia(null);
    setKeepOriginalMedia(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg w-full">
      {error && (
        <div className="mb-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-2 rounded-lg flex items-center animate-fade-in">
          <FiAlertCircle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Текстовое поле */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
          rows={3}
          maxLength={INPUT_LIMITS.MESSAGE_MAX_LENGTH}
          autoFocus
        />
        <div className="text-xs text-gray-500 text-right">
          {content.length}/{INPUT_LIMITS.MESSAGE_MAX_LENGTH}
        </div>

        {/* Предпросмотр медиа */}
        <div className="flex items-center gap-4">
          {previewUrl && (
            <div className="relative inline-block">
              {message.mediaType === "image" ||
              newMedia?.type?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                />
              ) : (
                <video
                  src={previewUrl}
                  className="max-w-[200px] max-h-[200px] rounded-lg"
                  controls
                />
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg">
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* Кнопка добавления/замены медиа */}
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*, video/mp4, video/webm"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              {previewUrl ? "Заменить медиа" : "Добавить медиа"}
            </button>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Сохранить
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageEditor;
