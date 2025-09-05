// moved from components/Profile/EditProfileTab.jsx
import {} from "react"; // React 18 JSX transform
import { useEditProfileTab } from "../model/useEditProfileTab";
import {
  FiLink,
  FiUpload,
  FiCamera,
  FiImage,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { BsEmojiSmile, BsHandThumbsUp, BsHeart } from "react-icons/bs";
import { INPUT_LIMITS, FILE_LIMITS } from "@constants/appConstants";

const EditProfileTab = ({
  formData,
  onFormChange,
  croppedAvatarPreview,
  croppedBannerPreview,
  onAvatarChange,
  onBannerChange,
}) => {
  // Логика вынесена в модельный хук для разделения UI и поведения
  const {
    descriptionRef,
    avatarInputRef,
    bannerInputRef,
    showLinkDialog,
    linkUrl,
    setLinkUrl,
    openLinkDialog,
    insertLink,
    insertEmoji,
    closeLinkDialog,
  } = useEditProfileTab({ formData, onFormChange });
  return (
    <div className="space-y-6">
      <div className="relative bg-gray-200 dark:bg-gray-700 h-40 rounded-lg overflow-hidden">
        {croppedBannerPreview ? (
          <img
            src={croppedBannerPreview}
            alt="Баннер"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <FiImage className="w-8 h-8 mr-2" /> <span>Нет баннера</span>
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
                <FiCamera className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Аватар
          </label>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onAvatarChange(e.target.files[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
            <FiUpload className="mr-2" /> Загрузить аватар
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Рекомендуется 256x256px (макс.{" "}
            {FILE_LIMITS.AVATAR_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Баннер
          </label>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onBannerChange(e.target.files[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
            <FiUpload className="mr-2" /> Загрузить баннер
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Рекомендуется 960x240px (макс.{" "}
            {FILE_LIMITS.BANNER_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Никнейм
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => onFormChange("username", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={INPUT_LIMITS.USERNAME_MAX_LENGTH}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            О себе
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={openLinkDialog}
              className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Вставить ссылку">
              <FiLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("😊")}
              className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Улыбка">
              <BsEmojiSmile className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("👍")}
              className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Палец вверх">
              <BsHandThumbsUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("❤️")}
              className="p-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
              title="Сердце">
              <BsHeart className="w-4 h-4" />
            </button>
          </div>
        </div>
        <textarea
          ref={descriptionRef}
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          placeholder="Расскажите немного о себе..."
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formData.description.length}/{INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Вставить ссылку
              </h3>
              <button
                onClick={closeLinkDialog}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <FiX size={20} />
              </button>
            </div>
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
                onClick={closeLinkDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center">
                <FiX className="mr-1.5" />
                Отмена
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center">
                <FiCheck className="mr-1.5" />
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
