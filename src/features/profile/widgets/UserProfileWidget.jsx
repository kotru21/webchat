import { useEffect, useRef, useState } from "react";
import api from "../../../services/api";
import ProfileCard from "../ui/ProfileCard";

export function UserProfileWidget({
  userId,
  profileData,
  anchorEl,
  isReversed,
  containerClassName = "",
  currentUserId,
  onStartChat,
  onClose,
}) {
  const [profile, setProfile] = useState(profileData || null);
  const [loading, setLoading] = useState(!profileData);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!profile && userId) {
      (async () => {
        try {
          const res = await api.get(`/api/auth/users/${userId}`);
          setProfile(res.data);
        } catch {
          setError("Не удалось загрузить профиль");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [userId, profile]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !anchorEl?.contains(e.target)
      ) {
        onClose && onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorEl, onClose]);

  const isCurrentUser = () => {
    if (!profile || !currentUserId) return false;
    return profile._id === currentUserId || profile.id === currentUserId;
  };

  return (
    <div
      ref={popoverRef}
      className={`absolute z-[1000] ${
        isReversed ? "profile-enter" : "profile-enter-reverse"
      } ${containerClassName}`}
      style={{ willChange: "transform, opacity" }}>
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] p-4">
          Загрузка...
        </div>
      )}
      {error && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[320px] p-4 text-red-500">
          {error}
        </div>
      )}
      {!loading && !error && profile && (
        <ProfileCard
          profile={profile}
          onStartChat={onStartChat}
          isCurrentUser={isCurrentUser()}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default UserProfileWidget;
