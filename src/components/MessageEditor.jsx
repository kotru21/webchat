import { useState, useRef } from "react";
import { FiX } from "react-icons/fi";

const MessageEditor = ({ message, onSave, onCancel }) => {
  const [content, setContent] = useState(message.content || "");
  const [newMedia, setNewMedia] = useState(null);
  const [keepOriginalMedia, setKeepOriginalMedia] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(
    message.mediaUrl
      ? `${import.meta.env.VITE_API_URL}${message.mediaUrl}`
      : null
  );
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Файл слишком большой (максимум 50MB)");
        return;
      }
      setNewMedia(file);
      setKeepOriginalMedia(false);
      if (previewUrl && !previewUrl.includes(import.meta.env.VITE_API_URL)) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    // Всегда добавляем контент
    formData.append("content", content);

    // Добавляем новый медиафайл
    if (newMedia) {
      formData.append("media", newMedia);
    }

    // Добавляем флаг удаления медиа
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
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Текстовое поле */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
          rows={3}
          autoFocus
        />

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
