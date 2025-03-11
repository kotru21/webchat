import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import Linkify from "react-linkify";

const UserProfile = ({
  userId,
  onClose,
  anchorEl,
  containerClassName = "",
  isReversed,
}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !anchorEl?.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorEl]);

  if (loading || !profile) return null;

  return (
    <div
      ref={popoverRef}
      className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[300px] z-[1000] ${
        isReversed ? "profile-enter" : "profile-enter-reverse"
      } ${containerClassName}`}
      style={{
        willChange: "transform, opacity",
      }}>
      {profile.banner && (
        <div className="h-24 overflow-hidden rounded-t-lg">
          <img
            src={`${import.meta.env.VITE_API_URL}${profile.banner}`}
            alt="Баннер"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-4 -mt-8">
          <img
            src={
              profile.avatar
                ? `${import.meta.env.VITE_API_URL}${profile.avatar}`
                : "/default-avatar.png"
            }
            alt="Аватар"
            className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 object-cover"
          />
          <div className="flex-1 mt-8 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {profile.username || profile.email}
            </h2>
          </div>
        </div>
        {profile.description && (
          <Linkify>
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm">
              {profile.description}
            </p>
          </Linkify>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
