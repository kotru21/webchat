import { useState, useRef } from "react";

const ProfileEditor = ({ user, onSave, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user.avatar ? `${import.meta.env.VITE_API_URL}${user.avatar}` : null
  );
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Размер файла не должен превышать 5MB");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || "Ошибка обновления профиля");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Редактировать профиль</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Никнейм</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Аватар</label>
            <div className="flex items-center space-x-4">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                Выбрать файл
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
