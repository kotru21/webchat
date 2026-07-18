import { useState, useEffect, useRef, memo, useCallback } from "react";
import { FiLogOut, FiMenu, FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import { ANIMATION_DELAYS } from "@constants/appConstants";
import { setupHoverPrefetch } from "@shared/lib/prefetch";
import { useSelectedUser } from "@shared/store/chatSelectors";
import { useUIStore } from "@shared/store/uiStore";
import { useAuth } from "@context/useAuth";
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";
import { Button } from "@shared/ui/button";

const THEME_CYCLE = ["system", "light", "dark"];

const themeMeta = {
  system: { icon: FiMonitor, label: "Тема: системная" },
  light: { icon: FiSun, label: "Тема: светлая" },
  dark: { icon: FiMoon, label: "Тема: тёмная" },
};

const ChatHeaderComponent = ({
  user,
  emptyTitle = "Выберите чат",
  onOpenSidebar,
  onOpenProfileEditor,
}) => {
  const { logout } = useAuth();
  const selectedUser = useSelectedUser();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const [loggingOut, setLoggingOut] = useState(false);
  const titleSource = selectedUser
    ? selectedUser.username || selectedUser.email
    : emptyTitle;
  const [title, setTitle] = useState(titleSource);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const titleTransitionKey = useRef(titleSource);

  useEffect(() => {
    if (titleTransitionKey.current === titleSource) return undefined;
    titleTransitionKey.current = titleSource;
    const fadeOut = window.setTimeout(() => {
      setIsTransitioning(true);
    }, 0);
    const swap = window.setTimeout(() => {
      setTitle(titleSource);
      setIsTransitioning(false);
    }, ANIMATION_DELAYS.CHAT_TRANSITION);
    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(swap);
    };
  }, [titleSource]);

  const avatarRef = useRef(null);

  useEffect(() => {
    const cleanup = setupHoverPrefetch(avatarRef.current, () =>
      import("@widgets/profile/ProfileEditor.jsx")
    );
    return cleanup;
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  }, [setTheme, theme]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout]);

  const ThemeIcon = themeMeta[theme]?.icon || FiMonitor;
  const themeLabel = themeMeta[theme]?.label || "Сменить тему";

  return (
    <header className="m3-surface-high sticky top-0 z-20 border-b border-border/70 px-4 py-3 backdrop-blur-xl sm:px-5 md:rounded-t-4xl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="h-12 w-12 shrink-0 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Открыть список чатов">
            <FiMenu size={22} />
          </Button>
          <h1
            className={`max-w-[72vw] truncate text-lg font-medium leading-6 text-foreground transition-all duration-300 ease-in-out sm:max-w-[52vw] sm:text-xl md:max-w-[38vw] ${
              isTransitioning
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            }`}>
            {title}
          </h1>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-12 gap-2 rounded-full px-2"
              onClick={onOpenProfileEditor}
              aria-label="Открыть профиль">
              <AuthorizedMediaImg
                ref={avatarRef}
                src={user?.avatar}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
              />
              <span className="max-w-[28vw] truncate text-xs text-muted-foreground sm:max-w-40 sm:text-sm">
                {user?.username || user?.email || "Пользователь"}
              </span>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-muted-foreground hover:text-foreground"
              onClick={cycleTheme}
              aria-label={themeLabel}
              title={themeLabel}>
              <ThemeIcon size={20} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label={loggingOut ? "Выход…" : "Выйти из аккаунта"}
              aria-busy={loggingOut}>
              <FiLogOut size={20} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
