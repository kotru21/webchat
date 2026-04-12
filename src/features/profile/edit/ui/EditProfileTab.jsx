// moved from components/Profile/EditProfileTab.jsx
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
      <div className="m3-surface-high relative h-40 overflow-hidden rounded-2xl border border-border/70">
        {croppedBannerPreview ? (
          <img
            src={croppedBannerPreview}
            alt="Баннер"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FiImage className="w-8 h-8 mr-2" /> <span>Нет баннера</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="relative inline-block">
            {croppedAvatarPreview ? (
              <img
                src={croppedAvatarPreview}
                alt="Аватар"
                className="h-20 w-20 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-muted">
                <FiCamera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/90">
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
            className="flex w-full items-center justify-center rounded-full border border-border/80 bg-card/80 px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted">
            <FiUpload className="mr-2" /> Загрузить аватар
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Рекомендуется 256x256px (макс.{" "}
            {FILE_LIMITS.AVATAR_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/90">
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
            className="flex w-full items-center justify-center rounded-full border border-border/80 bg-card/80 px-3 py-2 text-sm transition-colors duration-200 hover:bg-muted">
            <FiUpload className="mr-2" /> Загрузить баннер
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Рекомендуется 960x240px (макс.{" "}
            {FILE_LIMITS.BANNER_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/90">
          Никнейм
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => onFormChange("username", e.target.value)}
          className="w-full rounded-2xl border border-input bg-card/80 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/15"
          maxLength={INPUT_LIMITS.USERNAME_MAX_LENGTH}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-foreground/90">
            О себе
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={openLinkDialog}
              className="m3-surface rounded-lg p-1.5 text-xs hover:bg-muted"
              title="Вставить ссылку">
              <FiLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("😊")}
              className="m3-surface rounded-lg p-1.5 text-xs hover:bg-muted"
              title="Улыбка">
              <BsEmojiSmile className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("👍")}
              className="m3-surface rounded-lg p-1.5 text-xs hover:bg-muted"
              title="Палец вверх">
              <BsHandThumbsUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertEmoji("❤️")}
              className="m3-surface rounded-lg p-1.5 text-xs hover:bg-muted"
              title="Сердце">
              <BsHeart className="w-4 h-4" />
            </button>
          </div>
        </div>
        <textarea
          ref={descriptionRef}
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          className="min-h-30 w-full rounded-2xl border border-input bg-card/80 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/15"
          maxLength={INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          placeholder="Расскажите немного о себе..."
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-muted-foreground">
            {formData.description.length}/{INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="m3-surface-high w-full max-w-md rounded-2xl border border-border/70 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-foreground">
                Вставить ссылку
              </h3>
              <button
                onClick={closeLinkDialog}
                className="text-muted-foreground transition-colors hover:text-foreground">
                <FiX size={20} />
              </button>
            </div>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="mb-4 w-full rounded-2xl border border-input bg-card/80 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/15"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeLinkDialog}
                className="m3-pill flex items-center border border-border/80 bg-card/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                <FiX className="mr-1.5" />
                Отмена
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="m3-pill flex items-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-105">
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
