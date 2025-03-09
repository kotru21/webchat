import { useState } from "react";

const ProfileEditor = ({ user, onSave, onClose }) => {
  const [username, setUsername] = useState(user.username || "");
  const [description, setDescription] = useState(user.description || "");
  const [avatar, setAvatar] = useState(null);
  const [banner, setBanner] = useState(null);

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
            onChange={(e) => setAvatar(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Баннер
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBanner(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-500"
          />
        </div>
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
