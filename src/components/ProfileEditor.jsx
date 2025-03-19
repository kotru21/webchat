import { useState, useEffect } from "react";
import ProfileEditorTabs from "./Profile/ProfileEditorTabs";
import EditProfileTab from "./Profile/EditProfileTab";
import PreviewProfileTab from "./Profile/PreviewProfileTab";
import ImageCropperModal from "./Profile/ImageCropperModal";
import getCroppedImg from "./getCroppedImg";
import { FiX } from "react-icons/fi";

const ProfileEditor = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: user.username || "",
    description: user.description || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState(
    user.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : null
  );
  const [croppedBannerPreview, setCroppedBannerPreview] = useState(
    user.banner ? `${import.meta.env.VITE_API_URL}${user.banner}` : null
  );
  const [cropperState, setCropperState] = useState({
    show: false,
    type: null, // "avatar" или "banner"
    image: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspect: 1,
    croppedAreaPixels: null,
  });
  const [activeTab, setActiveTab] = useState("edit"); // "edit" или "preview"

  // Обработчик изменения полей формы
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Обработчик выбора файла аватара
  const handleAvatarChange = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой (максимум 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
        setCropperState({
          show: true,
          type: "avatar",
          image: reader.result,
          crop: { x: 0, y: 0 },
          zoom: 1,
          aspect: 1,
          croppedAreaPixels: null,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Обработчик выбора файла баннера
  const handleBannerChange = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Файл слишком большой (максимум 10MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setBannerPreview(reader.result);
        setCropperState({
          show: true,
          type: "banner",
          image: reader.result,
          crop: { x: 0, y: 0 },
          zoom: 1,
          aspect: 4,
          croppedAreaPixels: null,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Обработчик завершения кадрирования
  const handleCropComplete = (croppedAreaPixels) => {
    setCropperState((prev) => ({ ...prev, croppedAreaPixels }));
  };

  // Обработчик изменения зума
  const handleZoomChange = (zoom) => {
    setCropperState((prev) => ({ ...prev, zoom }));
  };

  // Обработчик изменения положения
  const handleCropChange = (crop) => {
    setCropperState((prev) => ({ ...prev, crop }));
  };

  // Обработчик закрытия модального окна кадрирования
  const handleCloseCropper = () => {
    setCropperState((prev) => ({ ...prev, show: false }));
  };

  // Обработчик применения кадрирования
  const handleApplyCrop = async () => {
    try {
      const { type, image, croppedAreaPixels } = cropperState;
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);

      if (type === "avatar") {
        setAvatarFile(croppedImage);
        setCroppedAvatarPreview(URL.createObjectURL(croppedImage));
      } else if (type === "banner") {
        setBannerFile(croppedImage);
        setCroppedBannerPreview(URL.createObjectURL(croppedImage));
      }

      setCropperState((prev) => ({ ...prev, show: false }));
    } catch (error) {
      console.error(`Ошибка при кадрировании ${cropperState.type}:`, error);
    }
  };

  // Обработчик отправки формы
  const handleSubmit = () => {
    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("description", formData.description);
    if (avatarFile) formDataToSend.append("avatar", avatarFile);
    if (bannerFile) formDataToSend.append("banner", bannerFile);
    onSave(formDataToSend);
  };

  // Создаем объект профиля для предпросмотра
  const previewProfile = {
    ...user,
    username: formData.username,
    description: formData.description,
    avatar: croppedAvatarPreview || user.avatar,
    banner: croppedBannerPreview || user.banner,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
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

        {/* Табы */}
        <ProfileEditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Содержимое таба */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "edit" ? (
            <EditProfileTab
              formData={formData}
              onFormChange={handleFormChange}
              croppedAvatarPreview={croppedAvatarPreview}
              croppedBannerPreview={croppedBannerPreview}
              onAvatarChange={handleAvatarChange}
              onBannerChange={handleBannerChange}
            />
          ) : (
            <PreviewProfileTab profile={previewProfile} />
          )}
        </div>

        {/* Кнопки действий */}
        <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Сохранить
          </button>
        </div>

        {/* Модальное окно для кадрирования */}
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
            title={
              cropperState.type === "avatar"
                ? "Настройка аватара"
                : "Настройка баннера"
            }
          />
        )}
      </div>
    </div>
  );
};

export default ProfileEditor;
