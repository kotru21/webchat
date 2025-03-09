import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./getCroppedImg"; // Утилита для кадрирования

const ProfileEditor = ({ user, onSave, onClose }) => {
  const [username, setUsername] = useState(user.username || "");
  const [description, setDescription] = useState(user.description || "");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);
  const [cropAvatar, setCropAvatar] = useState({ x: 0, y: 0 });
  const [zoomAvatar, setZoomAvatar] = useState(1);
  const [croppedAvatarArea, setCroppedAvatarArea] = useState(null);
  const [cropBanner, setCropBanner] = useState({ x: 0, y: 0 });
  const [zoomBanner, setZoomBanner] = useState(1);
  const [croppedBannerArea, setCroppedBannerArea] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState(null);
  const [croppedBannerPreview, setCroppedBannerPreview] = useState(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [showBannerCropper, setShowBannerCropper] = useState(false);

  // Обработка выбора аватара
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
        setShowAvatarCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Обработка выбора баннера
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBannerPreview(reader.result);
        setShowBannerCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Завершение кадрирования аватара
  const onCropCompleteAvatar = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAvatarArea(croppedAreaPixels);
  }, []);

  // Завершение кадрирования баннера
  const onCropCompleteBanner = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedBannerArea(croppedAreaPixels);
  }, []);

  // Применение кадрирования для аватара
  const handleCropAvatar = async () => {
    try {
      const croppedImage = await getCroppedImg(
        avatarPreview,
        croppedAvatarArea
      );
      setAvatar(croppedImage);
      setCroppedAvatarPreview(URL.createObjectURL(croppedImage));
      setShowAvatarCropper(false); // Скрыть кроппер после применения
    } catch (error) {
      console.error("Ошибка при кадрировании аватара:", error);
    }
  };

  // Применение кадрирования для баннера
  const handleCropBanner = async () => {
    try {
      const croppedImage = await getCroppedImg(
        bannerPreview,
        croppedBannerArea
      );
      setBanner(croppedImage);
      setCroppedBannerPreview(URL.createObjectURL(croppedImage));
      setShowBannerCropper(false); // Скрыть кроппер после применения
    } catch (error) {
      console.error("Ошибка при кадрировании баннера:", error);
    }
  };

  // Отправка данных на сервер
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    formData.append("description", description);
    if (avatar) formData.append("avatar", avatar);
    if (banner) formData.append("banner", banner);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 max-w-md w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Никнейм
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Аватар
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="mt-1 block w-full text-sm text-gray-500"
          />
          {croppedAvatarPreview && (
            <img
              src={croppedAvatarPreview}
              alt="Предпросмотр аватара"
              className="w-24 h-24 rounded-full object-cover mt-2"
            />
          )}
        </div>
        {showAvatarCropper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col z-50">
            <div className="flex-grow relative">
              <Cropper
                image={avatarPreview}
                crop={cropAvatar}
                zoom={zoomAvatar}
                aspect={1}
                onCropChange={setCropAvatar}
                onZoomChange={setZoomAvatar}
                onCropComplete={onCropCompleteAvatar}
                style={{ containerStyle: { height: "100%", width: "100%" } }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white flex justify-center">
              <button
                type="button"
                onClick={handleCropAvatar}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Применить кроп
              </button>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Баннер
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="mt-1 block w-full text-sm text-gray-500"
          />
          {croppedBannerPreview && (
            <img
              src={croppedBannerPreview}
              alt="Предпросмотр баннера"
              className="w-full h-32 object-cover rounded mt-2"
            />
          )}
        </div>
        {showBannerCropper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col z-50">
            <div className="flex-grow relative">
              <Cropper
                image={bannerPreview}
                crop={cropBanner}
                zoom={zoomBanner}
                aspect={16 / 9}
                onCropChange={setCropBanner}
                onZoomChange={setZoomBanner}
                onCropComplete={onCropCompleteBanner}
                style={{ containerStyle: { height: "100%", width: "100%" } }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white flex justify-center">
              <button
                type="button"
                onClick={handleCropBanner}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Применить кроп
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Сохранить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor;
