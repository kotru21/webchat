import { useState, useEffect, useRef } from "react";

const ChatHeader = ({
  user,
  selectedUser,
  onOpenSidebar,
  onOpenProfileEditor,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [title, setTitle] = useState(
    selectedUser
      ? `Чат с ${selectedUser.username || selectedUser.email}`
      : "Общий чат"
  );

  useEffect(() => {
    setIsTransitioning(true);
    const newTitle = selectedUser
      ? `Чат с ${selectedUser.username || selectedUser.email}`
      : "Общий чат";

    const timer = setTimeout(() => {
      setTitle(newTitle);
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedUser]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-4 sticky top-0 z-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
            ☰
          </button>
          <h1
            className={`text-xl font-semibold chat-title-transition ${
              isTransitioning ? "chat-title-enter" : "chat-title-enter-active"
            }`}>
            {title}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <img
              src={
                user.avatar
                  ? `${import.meta.env.VITE_API_URL}${user.avatar}`
                  : "/default-avatar.png"
              }
              alt="Your avatar"
              className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-all duration-200 transform hover:scale-105"
              onClick={onOpenProfileEditor}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.username || user.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
