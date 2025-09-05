import { useEffect, useRef } from "react";
import ProfileCard from "../ui/ProfileCard";
import { useUserProfile } from "@features/profile/api/useUserProfile";

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
  const {
    data: fetchedProfile,
    isLoading: loading,
    error,
  } = useUserProfile(profileData ? null : userId, {
    enabled: !profileData && !!userId,
  });
  const profile = profileData || fetchedProfile;
  const popoverRef = useRef(null);

  // Локальный эффект удаления не нужен — загрузка через React Query

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
