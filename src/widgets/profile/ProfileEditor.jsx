// Moved to widgets/profile per FSD
import ProfileEditorTabs from "@features/profile/edit/ui/ProfileEditorTabs";
import EditProfileTab from "@features/profile/edit/ui/EditProfileTab";
import PreviewProfileTab from "@entities/user/ui/PreviewProfileTab";
import ImageCropperModal from "@shared/ui/image/ImageCropperModal";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { useProfileEditor } from "./model/useProfileEditor";

const ProfileEditor = ({ user, onSave, onClose }) => {
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Редактирование профиля
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <ProfileEditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        {error && (
          <div className="mx-6 mt-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-2 rounded-lg flex items-center animate-fade-in">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="overflow-y-auto scrollbar-thin flex-1 p-6">
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
        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Сохранить
          </button>
        </div>
      </div>
      {cropperState.show && (
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
      )}
    </div>
  );
};

export default ProfileEditor;
