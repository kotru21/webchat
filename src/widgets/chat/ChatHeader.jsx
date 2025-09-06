import { useState, useEffect, useRef, memo } from "react";
import StatusSelector from "@features/status/selectStatus/ui/StatusSelector";
import { useAuth } from "@context/useAuth";
import { FiMenu } from "react-icons/fi";
import { ANIMATION_DELAYS } from "@constants/appConstants";
import { setupHoverPrefetch } from "@shared/lib/prefetch";
import { useSelectedUser } from "@shared/store/chatSelectors";

const ChatHeaderComponent = ({ user, onOpenSidebar, onOpenProfileEditor }) => {
  const selectedUser = useSelectedUser();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const titleSource = selectedUser
    ? selectedUser.username || selectedUser.email
    : "Общий чат";
  const [title, setTitle] = useState(titleSource);
  const { userStatus, handleStatusChange } = useAuth();

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

  useEffect(() => {
    // Префетч виджета редактора профиля по наведению на аватар
    const cleanup = setupHoverPrefetch(avatarRef.current, () =>
      import("@widgets/profile/ProfileEditor.jsx")
    );
    return cleanup;
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm py-3 px-3 sm:py-4 sm:px-4 sticky top-0 z-20">
      <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row justify-between sm:items-center">
        <div className="flex items-center min-w-0 space-x-3 sm:space-x-4">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
            <FiMenu size={22} />
          </button>
          <h1
            className={`text-lg sm:text-xl font-medium truncate max-w-[60vw] xs:max-w-[70vw] sm:max-w-[220px] transition-all duration-300 ease-in-out ${
              isTransitioning
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            }`}>
            {title}
          </h1>
        </div>
        <div className="flex items-stretch sm:items-center justify-between sm:justify-end gap-3 sm:gap-6 lg:pr-32">
          <div className="flex items-center min-w-0 space-x-2">
            <picture
              ref={avatarRef}
              onClick={onOpenProfileEditor}
              className="cursor-pointer">
              <source
                srcSet={
                  user.avatar
                    ? `${import.meta.env.VITE_API_URL}${user.avatar}`.replace(
                        /(\.[a-zA-Z0-9]+)$/i,
                        ".webp"
                      )
                    : "/default-avatar.png"
                }
                type="image/webp"
              />
              <img
                src={
                  user.avatar
                    ? `${import.meta.env.VITE_API_URL}${user.avatar}`
                    : "/default-avatar.png"
                }
                alt="Your avatar"
                loading="lazy"
                decoding="async"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full cursor-pointer hover:opacity-80 transition-all duration-200 transform hover:scale-105 flex-shrink-0"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            </picture>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate max-w-[40vw] sm:max-w-[180px]">
                {user.username || user.email}
              </span>
              <span className="sm:hidden flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-[2px]">
                <span
                  className={`inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse`}
                />
                В сети
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <StatusSelector
              currentStatus={userStatus}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

const ChatHeader = memo(ChatHeaderComponent);
export default ChatHeader;
