import { useLayoutEffect, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ProfileCard from "./ProfileCard";
import { useUserProfile } from "@features/profile/api/useUserProfile";

const CARD_WIDTH = 320;
const VIEW_MARGIN = 8;
/** Keep popover clear of the message composer / safe area. */
const BOTTOM_RESERVE = 88;
const FALLBACK_CARD_HEIGHT = 300;

function readAnchorRect(anchorRef, anchorEl, anchorRect) {
  const el = anchorRef?.current ?? anchorEl;
  if (el?.getBoundingClientRect) {
    return el.getBoundingClientRect();
  }
  return anchorRect || null;
}

function computePopoverPosition({
  rect,
  isReversed,
  cardHeight = FALLBACK_CARD_HEIGHT,
}) {
  if (!rect) {
    return { top: VIEW_MARGIN, left: VIEW_MARGIN };
  }

  const horizontalOffset = 12;
  const preferredLeft = isReversed
    ? rect.left - CARD_WIDTH - horizontalOffset
    : rect.right + horizontalOffset;

  const maxLeft = Math.max(VIEW_MARGIN, window.innerWidth - CARD_WIDTH - VIEW_MARGIN);
  let left = Math.min(Math.max(preferredLeft, VIEW_MARGIN), maxLeft);

  // If preferred side overflows, flip to the other side of the avatar.
  if (!isReversed && preferredLeft > maxLeft) {
    left = Math.min(
      Math.max(rect.left - CARD_WIDTH - horizontalOffset, VIEW_MARGIN),
      maxLeft
    );
  } else if (isReversed && preferredLeft < VIEW_MARGIN) {
    left = Math.min(
      Math.max(rect.right + horizontalOffset, VIEW_MARGIN),
      maxLeft
    );
  }

  const maxTop = Math.max(
    VIEW_MARGIN,
    window.innerHeight - cardHeight - VIEW_MARGIN - BOTTOM_RESERVE
  );
  // Prefer aligning to avatar top; nudge up if the card would cover the composer.
  const top = Math.min(Math.max(rect.top, VIEW_MARGIN), maxTop);

  return { top, left };
}

export function UserProfileWidget({
  userId,
  profileData,
  anchorEl,
  anchorRef,
  anchorRect,
  isReversed,
  /** "popover" (default) = fixed portal card; "embedded" = in-flow layout */
  variant = "popover",
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
  const [position, setPosition] = useState(() =>
    computePopoverPosition({
      rect: anchorRect || null,
      isReversed,
    })
  );
  const [ready, setReady] = useState(
    () => variant === "embedded" || Boolean(anchorRect)
  );

  const isEmbedded =
    variant === "embedded" || containerClassName.includes("relative");

  const updatePosition = useCallback(() => {
    const rect = readAnchorRect(anchorRef, anchorEl, anchorRect);
    const cardHeight =
      popoverRef.current?.offsetHeight || FALLBACK_CARD_HEIGHT;
    setPosition(
      computePopoverPosition({ rect, isReversed, cardHeight })
    );
    setReady(true);
  }, [anchorEl, anchorRef, anchorRect, isReversed]);

  useLayoutEffect(() => {
    if (isEmbedded) return undefined;
    updatePosition();
  }, [isEmbedded, updatePosition, userId, loading, profile]);

  useEffect(() => {
    if (isEmbedded) return undefined;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isEmbedded, updatePosition]);

  useEffect(() => {
    if (isEmbedded) return undefined;

    const handlePointerDown = (e) => {
      // Switching to another avatar: let that click open the next preview
      // without a close→open remount flash.
      if (e.target.closest?.("[data-profile-anchor]")) return;

      const anchor = anchorRef?.current ?? anchorEl;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !anchor?.contains?.(e.target)
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorEl, anchorRef, isEmbedded, onClose]);

  const isCurrentUser = () => {
    if (!profile || !currentUserId) return false;
    return profile._id === currentUserId || profile.id === currentUserId;
  };

  const content = (
    <div
      ref={popoverRef}
      role={isEmbedded ? undefined : "dialog"}
      aria-modal={isEmbedded ? undefined : false}
      aria-label={
        isEmbedded
          ? undefined
          : profile?.username
            ? `Профиль: ${profile.username}`
            : "Профиль пользователя"
      }
      className={containerClassName}
      style={
        isEmbedded
          ? { position: "relative" }
          : {
              position: "fixed",
              top: position.top,
              left: position.left,
              zIndex: 60,
              visibility: ready ? "visible" : "hidden",
            }
      }>
      {loading && (
        <div
          className="m3-surface-high w-[320px] rounded-2xl border border-border/70 p-4 text-sm text-muted-foreground shadow-xl"
          role="status">
          Загрузка...
        </div>
      )}
      {error && !loading && (
        <div
          className="m3-surface-high w-[320px] rounded-2xl border border-destructive/35 p-4 text-sm text-destructive shadow-xl"
          role="alert">
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

  if (isEmbedded) {
    return content;
  }

  return createPortal(content, document.body);
}

export default UserProfileWidget;
