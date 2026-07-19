import { useLayoutEffect, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ProfileCard from "./ProfileCard";
import { useUserProfile } from "@features/profile/api/useUserProfile";
import { getFocusable } from "@shared/ui/AccessibleDialog";

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
  const restoreFocusRef = useRef(null);
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

  // Focus trap + restore (popover is a modal dialog for a11y).
  useEffect(() => {
    if (isEmbedded) return undefined;

    restoreFocusRef.current = document.activeElement;

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
        e.stopPropagation();
        onClose?.();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = popoverRef.current;
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel?.focus?.({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      } else if (!panel?.contains(active)) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      const restore = restoreFocusRef.current;
      // preventScroll: restoring to the avatar must not jump the message list.
      if (restore && typeof restore.focus === "function") {
        restore.focus({ preventScroll: true });
      }
    };
  }, [anchorEl, anchorRef, isEmbedded, onClose, userId]);

  // Move focus into the panel once content is ready (or while loading).
  useEffect(() => {
    if (isEmbedded) return undefined;
    queueMicrotask(() => {
      const panel = popoverRef.current;
      if (!panel) return;
      const focusable = getFocusable(panel);
      (focusable[0] || panel).focus?.({ preventScroll: true });
    });
  }, [isEmbedded, loading, profile, error, userId]);

  const isCurrentUser = () => {
    if (!profile || !currentUserId) return false;
    return profile._id === currentUserId || profile.id === currentUserId;
  };

  const content = (
    <div
      ref={popoverRef}
      role={isEmbedded ? undefined : "dialog"}
      aria-modal={isEmbedded ? undefined : true}
      tabIndex={isEmbedded ? undefined : -1}
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
              outline: "none",
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
