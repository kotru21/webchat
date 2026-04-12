import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProfileCard from "./ProfileCard";
import { useUserProfile } from "@features/profile/api/useUserProfile";

export function UserProfileWidget({
  userId,
  profileData,
  anchorEl,
  anchorRef,
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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const isInlineMode = useMemo(
    () => containerClassName.includes("relative"),
    [containerClassName]
  );

  useEffect(() => {
    if (isInlineMode) return;

    const resolvedAnchor = anchorRef?.current ?? anchorEl;
    if (!resolvedAnchor) return;

    const updatePosition = () => {
      const rect = resolvedAnchor.getBoundingClientRect();
      const horizontalOffset = 12;
      const cardWidth = 320;
      const top = rect.top;
      const preferredLeft = isReversed
        ? rect.left - cardWidth - horizontalOffset
        : rect.right + horizontalOffset;

      const minLeft = 8;
      const maxLeft = window.innerWidth - cardWidth - 8;
      const left = Math.min(Math.max(preferredLeft, minLeft), maxLeft);

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorEl, anchorRef, isInlineMode, isReversed]);

  useEffect(() => {
    const resolvedAnchor = anchorRef?.current ?? anchorEl;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !resolvedAnchor?.contains(e.target)
      ) {
        onClose && onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorEl, anchorRef, onClose]);

  const isCurrentUser = () => {
    if (!profile || !currentUserId) return false;
    return profile._id === currentUserId || profile.id === currentUserId;
  };

  const content = (
    <div
      ref={popoverRef}
      className={`${
        isReversed ? "profile-enter" : "profile-enter-reverse"
      } ${containerClassName}`}
      style={{
        position: isInlineMode ? "absolute" : "fixed",
        top: isInlineMode ? undefined : `${position.top}px`,
        left: isInlineMode ? undefined : `${position.left}px`,
        zIndex: 2147483647,
        willChange: "transform, opacity",
      }}>
      {loading && (
        <div className="m3-surface-high w-[320px] rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground shadow-xl">
          Загрузка...
        </div>
      )}
      {error && !loading && (
        <div className="m3-surface-high w-[320px] rounded-2xl border border-destructive/35 p-4 text-sm text-destructive shadow-xl">
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

  if (isInlineMode) {
    return content;
  }

  return createPortal(content, document.body);
}

export default UserProfileWidget;
