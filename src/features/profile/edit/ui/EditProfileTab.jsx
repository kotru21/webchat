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
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";
import { AccessibleDialog } from "@shared/ui/AccessibleDialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useId } from "react";

const LOCAL_PREVIEW_RE = /^(?:blob:|data:)/i;

/** Cropped blobs use <img>; existing /api/media/* needs authorized fetch. */
function ProfilePreviewImage({ src, alt, className }) {
  if (!src) return null;
  if (LOCAL_PREVIEW_RE.test(src)) {
    return <img src={src} alt={alt} className={className} />;
  }
  return <AuthorizedMediaImg src={src} alt={alt} className={className} fallback="" />;
}

const EditProfileTab = ({
  formData,
  onFormChange,
  croppedAvatarPreview,
  croppedBannerPreview,
  onAvatarChange,
  onBannerChange,
}) => {
  const linkTitleId = useId();
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
    <div
      role="tabpanel"
      id="profile-tabpanel-edit"
      aria-labelledby="profile-tab-edit"
      className="space-y-6">
      <div className="m3-surface-high relative h-40 overflow-hidden rounded-2xl border border-border/70">
        {croppedBannerPreview ? (
          <ProfilePreviewImage
            src={croppedBannerPreview}
            alt="Баннер"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FiImage className="mr-2 h-8 w-8" aria-hidden />
            <span>Нет баннера</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4">
          <div className="relative inline-block">
            {croppedAvatarPreview ? (
              <ProfilePreviewImage
                src={croppedAvatarPreview}
                alt="Аватар"
                className="h-20 w-20 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-muted">
                <FiCamera className="h-8 w-8 text-muted-foreground" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="mb-1 block">Аватар</Label>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onAvatarChange(e.target.files[0])}
            className="hidden"
            tabIndex={-1}
            aria-hidden
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => avatarInputRef.current?.click()}>
            <FiUpload aria-hidden /> Загрузить аватар
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Рекомендуется 256x256px (макс.{" "}
            {FILE_LIMITS.AVATAR_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
        <div>
          <Label className="mb-1 block">Баннер</Label>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => onBannerChange(e.target.files[0])}
            className="hidden"
            tabIndex={-1}
            aria-hidden
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={() => bannerInputRef.current?.click()}>
            <FiUpload aria-hidden /> Загрузить баннер
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">
            Рекомендуется 960x240px (макс.{" "}
            {FILE_LIMITS.BANNER_MAX_SIZE / (1024 * 1024)}MB)
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-username">Никнейм</Label>
        <Input
          id="profile-username"
          type="text"
          value={formData.username}
          onChange={(e) => onFormChange("username", e.target.value)}
          maxLength={INPUT_LIMITS.USERNAME_MAX_LENGTH}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="profile-description">О себе</Label>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openLinkDialog}
              aria-label="Вставить ссылку">
              <FiLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertEmoji("😊")}
              aria-label="Вставить эмодзи улыбки">
              <BsEmojiSmile className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertEmoji("👍")}
              aria-label="Вставить эмодзи палец вверх">
              <BsHandThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => insertEmoji("❤️")}
              aria-label="Вставить эмодзи сердце">
              <BsHeart className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <textarea
          id="profile-description"
          ref={descriptionRef}
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          className="min-h-30 w-full rounded-2xl border border-input bg-card/80 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          maxLength={INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          placeholder="Расскажите немного о себе..."
        />
        <div className="mt-1 flex justify-end">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {formData.description.length}/{INPUT_LIMITS.DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>
      {showLinkDialog ? (
        <AccessibleDialog
          open
          onClose={closeLinkDialog}
          labelledBy={linkTitleId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          panelClassName="m3-surface-high w-full max-w-md rounded-2xl border border-border/70 p-6 shadow-xl outline-none">
          <div className="mb-4 flex items-center justify-between">
            <h3 id={linkTitleId} className="text-lg font-medium text-foreground">
              Вставить ссылку
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={closeLinkDialog}
              aria-label="Закрыть">
              <FiX size={20} />
            </Button>
          </div>
          <Label htmlFor="profile-link-url" className="sr-only">
            URL ссылки
          </Label>
          <Input
            id="profile-link-url"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeLinkDialog}>
              <FiX className="mr-1.5" aria-hidden />
              Отмена
            </Button>
            <Button type="button" onClick={insertLink}>
              <FiCheck className="mr-1.5" aria-hidden />
              Вставить
            </Button>
          </div>
        </AccessibleDialog>
      ) : null}
    </div>
  );
};

export default EditProfileTab;
