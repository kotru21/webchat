import { useState, useEffect, useRef, memo } from "react";
import { FiMenu } from "react-icons/fi";
import { ANIMATION_DELAYS } from "@constants/appConstants";
import { setupHoverPrefetch } from "@shared/lib/prefetch";
import { useSelectedUser } from "@shared/store/chatSelectors";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";
import { Button } from "@shared/ui/button";

const ChatHeaderComponent = ({ user, onOpenSidebar, onOpenProfileEditor }) => {
  const selectedUser = useSelectedUser();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const titleSource = selectedUser
    ? selectedUser.username || selectedUser.email
    : "Общий чат";
  const [title, setTitle] = useState(titleSource);

  useEffect(() => {
    setIsTransitioning(true);
    const newTitle = selectedUser
      ? selectedUser.username || selectedUser.email
      : "Общий чат";
    const t = setTimeout(() => {
      setTitle(newTitle);
      setIsTransitioning(false);
    }, ANIMATION_DELAYS.CHAT_TRANSITION);
    return () => clearTimeout(t);
  }, [selectedUser]);

  const avatarRef = useRef(null);
  const avatarSrc = toAbsoluteMediaUrl(user?.avatar) || "/default-avatar.png";

  useEffect(() => {
    // Префетч виджета редактора профиля по наведению на аватар
    const cleanup = setupHoverPrefetch(avatarRef.current, () =>
      import("@widgets/profile/ProfileEditor.jsx")
    );
    return cleanup;
  }, []);

  return (
    <header className="m3-surface-high sticky top-0 z-20 border-b border-border/70 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Открыть список чатов">
            <FiMenu size={22} />
          </Button>
          <h1
            className={`max-w-[72vw] truncate text-lg font-medium text-foreground transition-all duration-300 ease-in-out sm:max-w-[52vw] sm:text-xl md:max-w-[38vw] ${
              isTransitioning
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            }`}>
            {title}
          </h1>
        </div>

        <div className="flex items-stretch justify-between gap-3 sm:items-center sm:justify-end sm:gap-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              ref={avatarRef}
              onClick={onOpenProfileEditor}
              src={avatarSrc}
              alt="Your avatar"
              loading="lazy"
              decoding="async"
              className="h-10 w-10 shrink-0 cursor-pointer rounded-full object-cover ring-2 ring-primary/30 transition-all duration-200 hover:scale-105 hover:opacity-90"
              onError={(e) => {
                if (e.currentTarget.src.endsWith("/default-avatar.png")) return;
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="max-w-[40vw] truncate text-xs text-muted-foreground sm:max-w-60 sm:text-sm">
                {user?.username || user?.email || "Пользователь"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
