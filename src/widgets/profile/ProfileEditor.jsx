import ProfileEditorTabs from "@features/profile/edit/ui/ProfileEditorTabs";
import EditProfileTab from "@features/profile/edit/ui/EditProfileTab";
import PreviewProfileTab from "./ui/PreviewProfileTab";
import ImageCropperModal from "@shared/ui/image/ImageCropperModal";
import { AccessibleDialog } from "@shared/ui/AccessibleDialog";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { useId } from "react";
import { useProfileEditor } from "./model/useProfileEditor";

const ProfileEditor = ({ user, onSave, onClose }) => {
  const titleId = useId();
  const {
    formData,
    croppedAvatarPreview,
    croppedBannerPreview,
    previewProfile,
    error,
    activeTab,
    cropperState,
    setActiveTab,
    handleFormChange,
    onAvatarChange,
    onBannerChange,
    handleSubmit,
    handleCropComplete,
    handleZoomChange,
    handleCropChange,
    handleCloseCropper,
    handleApplyCrop,
  } = useProfileEditor({ user, onSave });

  return (
    <>
      <AccessibleDialog
        open
        onClose={onClose}
        labelledBy={titleId}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
        panelClassName="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl outline-none animate-scale-in">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3">
          <h2 id={titleId} className="text-xl font-semibold">
            Редактирование профиля
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Закрыть редактор профиля">
            <FiX className="h-5 w-5" />
          </Button>
        </div>
        <ProfileEditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {error && (
          <Alert
            variant="destructive"
            className="mx-6 mt-4 py-3 animate-fade-in">
            <FiAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
          {activeTab === "edit" ? (
            <EditProfileTab
              formData={formData}
              onFormChange={handleFormChange}
              croppedAvatarPreview={croppedAvatarPreview}
              croppedBannerPreview={croppedBannerPreview}
              onAvatarChange={onAvatarChange}
              onBannerChange={onBannerChange}
            />
          ) : (
            <PreviewProfileTab profile={previewProfile} />
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-border/70 bg-muted/40 p-4">
          <Button type="button" onClick={onClose} variant="secondary">
            Отмена
          </Button>
          <Button type="button" onClick={handleSubmit} variant="default">
            Сохранить
          </Button>
        </div>
      </AccessibleDialog>
      {cropperState.show ? (
        <ImageCropperModal
          image={cropperState.image}
          crop={cropperState.crop}
          zoom={cropperState.zoom}
          aspect={cropperState.aspect}
          onCropChange={handleCropChange}
          onZoomChange={handleZoomChange}
          onCropComplete={handleCropComplete}
          onClose={handleCloseCropper}
          onApply={handleApplyCrop}
        />
      ) : null}
    </>
  );
};

export default ProfileEditor;
