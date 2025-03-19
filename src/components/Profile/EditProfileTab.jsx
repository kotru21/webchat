import { useRef, useState } from "react";
import { FiLink } from "react-icons/fi";

const EditProfileTab = ({
  formData,
  onFormChange,
  croppedAvatarPreview,
  croppedBannerPreview,
  onAvatarChange,
  onBannerChange,
}) => {
  const descriptionRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedTextRange, setSelectedTextRange] = useState({
    start: 0,
    end: 0,
  });

  // Вставка ссылки в описание - открываем диалог
  const handleOpenLinkDialog = () => {
    // Сохраняем текущее выделение
    if (descriptionRef.current) {
      setSelectedTextRange({
        start: descriptionRef.current.selectionStart,
        end: descriptionRef.current.selectionEnd,
      });
    }
    setLinkUrl("");
    setShowLinkDialog(true);
  };

  // Вставка ссылки из диалога
  const handleInsertLink = () => {
    if (!linkUrl) {
      setShowLinkDialog(false);
      return;
    }

    // Форматируем URL если нужно
    let formattedUrl = linkUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const description = formData.description;
    const { start, end } = selectedTextRange;

    const newDescription =
      description.substring(0, start) +
      formattedUrl +
      description.substring(end);

    onFormChange("description", newDescription);
    setShowLinkDialog(false);

    // Восстанавливаем фокус
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.focus();
        descriptionRef.current.setSelectionRange(
          start + formattedUrl.length,
          start + formattedUrl.length
        );
      }
    }, 10);
  };

  // Вставка эмодзи
  const insertEmoji = (emoji) => {
    if (!descriptionRef.current) return;

    const textArea = descriptionRef.current;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const description = formData.description;

    const newDescription =
      description.substring(0, start) + emoji + description.substring(end);

    onFormChange("description", newDescription);

    // Устанавливаем фокус и позицию курсора после вставки
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Предпросмотр баннера и аватара */}
      <div className="relative bg-gray-200 dark:bg-gray-700 h-40 rounded-lg overflow-hidden">
        {croppedBannerPreview ? (
          <img
            src={croppedBannerPreview}
            alt="Баннер"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            Нет баннера
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <div className="relative inline-block">
            {croppedAvatarPreview ? (
              <img
                src={croppedAvatarPreview}
                alt="Аватар"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-800">
                <span className="text-xl text-gray-500 dark:text-gray-400">
                  ?
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Загрузка изображений */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Аватар
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onAvatarChange(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Рекомендуется изображение 256x256px (макс. 5MB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Баннер
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onBannerChange(e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Рекомендуется изображение 960x240px (макс. 10MB)
          </p>
        </div>
      </div>

      {/* Никнейм */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Никнейм
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => onFormChange("username", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={32}
        />
      </div>

      {/* Описание */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            О себе
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleOpenLinkDialog}
              className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded flex items-center"
              title="Вставить ссылку">
              <FiLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("😊")}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Улыбка">
              😊
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("👍")}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Палец вверх">
              👍
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("❤️")}
              className="p-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Сердце">
              ❤️
            </button>
          </div>
        </div>
        <textarea
          ref={descriptionRef}
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
          placeholder="Расскажите немного о себе..."
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formData.description.length}/500
          </span>
        </div>
      </div>

      {/* Диалог вставки ссылки */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Вставить ссылку
            </h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                Отмена
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                Вставить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileTab;
