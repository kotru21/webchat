import { useState, useEffect } from "react";
import ProfileEditorTabs from "./Profile/ProfileEditorTabs";
import EditProfileTab from "./Profile/EditProfileTab";
import PreviewProfileTab from "./Profile/PreviewProfileTab";
import ImageCropperModal from "./Profile/ImageCropperModal";
import { getCroppedImg } from "../utils/imageUtils";
import { FiX, FiAlertCircle } from "react-icons/fi";
import { FILE_LIMITS, INPUT_LIMITS } from "../constants/appConstants";

const ProfileEditor = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    username: user.username || "",
    description: user.description || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState(
    user.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : null
  );
  const [croppedBannerPreview, setCroppedBannerPreview] = useState(
    user.banner ? `${import.meta.env.VITE_API_URL}${user.banner}` : null
  );
  const [error, setError] = useState(null);
  const [cropperState, setCropperState] = useState({
    show: false,
    type: null,
    image: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspect: 1,
    croppedAreaPixels: null,
  });
  const [activeTab, setActiveTab] = useState("edit");

  // Автоматически скрывать сообщение об ошибке после 5 секунд
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Обработчик изменения полей формы
  const handleFormChange = (field, value) => {
    if (
      field === "username" &&
      value.length > INPUT_LIMITS.USERNAME_MAX_LENGTH
    ) {
      setError(
        `Никнейм не может быть длиннее ${INPUT_LIMITS.USERNAME_MAX_LENGTH} символов`
      );
      return;
    }

    if (
      field === "description" &&
      value.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH
    ) {
      setError(
        `Описание не может быть длиннее ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} символов`
      );
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Обработчик выбора файла аватара
  const handleAvatarChange = (file) => {
    if (!file) return;

    if (file.size > FILE_LIMITS.AVATAR_MAX_SIZE) {
      setError(
        `Аватар слишком большой. Максимальный размер: ${
          FILE_LIMITS.AVATAR_MAX_SIZE / (1024 * 1024)
        }MB`
      );
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Неподдерживаемый формат файла для аватара. Разрешены только изображения (JPEG, PNG, GIF)."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({
        show: true,
        type: "avatar",
        image: reader.result,
        crop: { x: 0, y: 0 },
        zoom: 1,
        aspect: 1,
        croppedAreaPixels: null,
      });
      setError(null);
    };
    reader.onerror = () => {
      setError(
        "Не удалось прочитать файл. Попробуйте выбрать другое изображение."
      );
    };
    reader.readAsDataURL(file);
  };

  // Обработчик выбора файла баннера
  const handleBannerChange = (file) => {
    if (!file) return;

    if (file.size > FILE_LIMITS.BANNER_MAX_SIZE) {
      setError(
        `Баннер слишком большой. Максимальный размер: ${
          FILE_LIMITS.BANNER_MAX_SIZE / (1024 * 1024)
        }MB`
      );
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "Неподдерживаемый формат файла для баннера. Разрешены только изображения (JPEG, PNG, GIF)."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperState({
        show: true,
        type: "banner",
        image: reader.result,
        crop: { x: 0, y: 0 },
        zoom: 1,
        aspect: 4,
        croppedAreaPixels: null,
      });
      setError(null);
    };
    reader.onerror = () => {
      setError(
        "Не удалось прочитать файл. Попробуйте выбрать другое изображение."
      );
    };
    reader.readAsDataURL(file);
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
      setError(null);
    } catch (error) {
      console.error(`Ошибка при кадрировании ${cropperState.type}:`, error);
      setError(
        `Не удалось обработать изображение. Попробуйте другое или уменьшите размер.`
      );
    }
  };

  // Валидация формы
  const validateForm = () => {
    if (!formData.username || formData.username.trim() === "") {
      setError("Никнейм не может быть пустым");
      return false;
    }

    if (formData.username.length > INPUT_LIMITS.USERNAME_MAX_LENGTH) {
      setError(
        `Никнейм не может быть длиннее ${INPUT_LIMITS.USERNAME_MAX_LENGTH} символов`
      );
      return false;
    }

    if (
      formData.description &&
      formData.description.length > INPUT_LIMITS.DESCRIPTION_MAX_LENGTH
    ) {
      setError(
        `Описание не может быть длиннее ${INPUT_LIMITS.DESCRIPTION_MAX_LENGTH} символов`
      );
      return false;
    }

    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = () => {
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append("username", formData.username);
    formDataToSend.append("description", formData.description);

    if (avatarFile) formDataToSend.append("avatar", avatarFile);
    if (bannerFile) formDataToSend.append("banner", bannerFile);

    onSave(formDataToSend);
  };

  // объект профиля для предпросмотра
  const previewProfile = {
    ...user,
    username: formData.username,
    description: formData.description,
    // Если у нас есть предпросмотр - используем его, иначе используем текущий аватар
    avatar: croppedAvatarPreview
      ? croppedAvatarPreview.replace(import.meta.env.VITE_API_URL, "") // Удаляем базовый URL для соответствия формату
      : user.avatar,
    banner: croppedBannerPreview
      ? croppedBannerPreview.replace(import.meta.env.VITE_API_URL, "") // Удаляем базовый URL для соответствия формату
      : user.banner,
    status: user.status,
    createdAt: user.createdAt,
    email: user.email,
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

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-2 rounded-lg flex items-center animate-fade-in">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
