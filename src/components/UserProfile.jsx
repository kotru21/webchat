import { useState, useEffect } from "react";
import api from "../services/api";
import Linkify from "react-linkify";

const UserProfile = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/auth/users/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div className="text-center">Загрузка...</div>;
  if (!profile) return <div className="text-center">Профиль не найден</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300">
          ×
        </button>
        {profile.banner && (
          <img
            src={`${import.meta.env.VITE_API_URL}${profile.banner}`}
            alt="Баннер"
            className="w-full h-32 object-cover rounded-t-lg"
          />
        )}
        <div className="flex items-center space-x-4 mt-4">
          <img
            src={
              profile.avatar
                ? `${import.meta.env.VITE_API_URL}${profile.avatar}`
                : "/default-avatar.png"
            }
            alt="Аватар"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile.username || profile.email}
            </h2>
            {profile.description && (
              <Linkify>
                <p className="text-gray-600 dark:text-gray-300">
                  {profile.description}
                </p>
              </Linkify>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
