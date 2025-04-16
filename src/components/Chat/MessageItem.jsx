import { useState, useRef, memo, useEffect } from "react";
import ReadStatus from "../ReadStatus";
import UserProfile from "../UserProfile";
import MessageEditor from "../MessageEditor";

const MessageItem = memo(
  ({
    message,
    currentUser,
    onDelete,
    onMediaClick,
    onPin,
    isMenuOpen,
    onToggleMenu,
    onSaveEdit,
    onStartChat,
  }) => {
    const isOwnMessage = message.sender._id === currentUser.id;
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const messageRef = useRef(null);
    const profileTriggerRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const messageContentRef = useRef(null);

    const handlePin = async () => {
      try {
        await onPin(message._id, !message.isPinned);
      } catch (error) {
        console.error("Ошибка при закреплении:", error);
      }
    };

    const handleProfileClick = (event) => {
      event.stopPropagation();
      setIsProfileOpen(!isProfileOpen);
    };

    // Заменяем обычный клик на contextmenu (правый клик)
    const handleContextMenu = (e) => {
      e.preventDefault(); // Предотвращаем стандартное контекстное меню браузера

      // Определяем позицию меню относительно точки клика
      const rect = messageRef.current.getBoundingClientRect();

      // Вычисляем позицию относительно контейнера сообщения
      // Для собственных сообщений используем другой расчет
      if (isOwnMessage) {
        // Получаем ширину контейнера сообщения
        const containerWidth = rect.width;
        // Вычисляем расстояние от правого края до точки клика
        const rightOffset = containerWidth - (e.clientX - rect.left);

        setMenuPosition({
          x: rightOffset,
          y: e.clientY - rect.top,
        });
      } else {
        setMenuPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      // Отображаем меню
      onToggleMenu();
    };

    // Закрываем меню при клике на сообщение
    const handleClick = (e) => {
      if (isMenuOpen) {
        onToggleMenu(); // Закрываем меню
      }
    };

    const handleEdit = (e) => {
      e.stopPropagation();
      setIsEditing(true);
      onToggleMenu(); // закрываем меню
    };

    const handleSaveEdit = async (formData) => {
      await onSaveEdit(message._id, formData);
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
    };

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const renderMessageContent = () => (
      <div ref={messageContentRef}>
        {message.content && (
          <div className="flex flex-col">
            <p
              className={`text-sm break-words ${
                isOwnMessage ? "text-right" : "text-left"
              }`}>
              {message.content}
            </p>
            {(message.isEdited || message.isDeleted) && (
              <span
                className={`text-xs ${
                  isOwnMessage
                    ? "text-right text-gray-300"
                    : "text-left text-gray-500"
                }`}>
                {message.isDeleted ? "удалено" : "изменено"}
              </span>
            )}
          </div>
        )}
        {!message.isDeleted &&
          message.mediaUrl &&
          message.mediaType === "image" && (
            <img
              src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
              alt="Изображение"
              className="lg:max-w-[400px] lg:max-h-[400px] max-w-[200px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onMediaClick(message.mediaUrl, "image");
              }}
            />
          )}
        {!message.isDeleted &&
          message.mediaUrl &&
          message.mediaType === "video" && (
            <video
              src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
              className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
              controls
              onClick={(e) => {
                e.stopPropagation();
                onMediaClick(message.mediaUrl, "video");
              }}
            />
          )}
      </div>
    );

    // Если сообщение в режиме редактирования, показываем редактор
    if (isEditing) {
      return (
        <div
          className={`flex justify-${isOwnMessage ? "end" : "start"} w-full`}>
          <div
            className={`max-w-[80%] transition-all duration-300 animate-fade-in`}>
            <MessageEditor
              message={message}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        ref={messageRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } w-full relative`}>
        <div
          className={`max-w-[80%] message-wrapper ${
            message.isPinned ? "pinned-message" : ""
          }`}>
          {/* Контекстное меню сообщения */}
          <div
            className={`absolute flex flex-col gap-2 transition-all duration-300 ease-in-out ${
              isMenuOpen ? "opacity-100 z-20" : "opacity-0 pointer-events-none"
            } bg-white dark:bg-gray-800 py-3 px-4 rounded-md shadow-lg transition-all duration-200 z-10`}
            style={{
              left: isOwnMessage ? "auto" : `${menuPosition.x}px`,
              right: isOwnMessage ? `${menuPosition.x}px` : "auto",
              top: `${menuPosition.y}px`,
            }}>
            {isOwnMessage && (
              <>
                <button
                  onClick={handleEdit}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
                  Редактировать
                </button>
                <button
                  onClick={onDelete}
                  className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
                  Удалить
                </button>
              </>
            )}
            <button
              onClick={handlePin}
              className="text-sm text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400">
              {message.isPinned ? "Открепить" : "Закрепить"}
            </button>
          </div>

          <div
            className={`flex items-start ${
              isOwnMessage ? "flex-row-reverse" : "flex-row"
            } gap-2`}>
            <div className="cursor-pointer flex items-center gap-2">
              <div
                ref={profileTriggerRef}
                onClick={handleProfileClick}
                className="relative">
                <img
                  src={
                    message.sender.avatar
                      ? `${import.meta.env.VITE_API_URL}${
                          message.sender.avatar
                        }`
                      : "/default-avatar.png"
                  }
                  alt={`${
                    message.sender.username || message.sender.email
                  }'s avatar`}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                {isProfileOpen && (
                  <div className="absolute top-0">
                    <UserProfile
                      userId={message.sender._id}
                      onClose={() => setIsProfileOpen(false)}
                      anchorEl={profileTriggerRef.current}
                      isReversed={isOwnMessage}
                      containerClassName={`${
                        isOwnMessage
                          ? "right-full translate-x-[-8px]"
                          : "left-full translate-x-[8px]"
                      }`}
                      currentUserId={currentUser.id}
                      onStartChat={onStartChat} // Используем проп, переданный из родителя
                    />
                  </div>
                )}
              </div>
            </div>
            <div
              className={`rounded-lg px-4 py-2 hover-lift ${
                isOwnMessage
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}>
              <div
                className={`text-sm font-medium mb-1 ${
                  isOwnMessage ? "text-right" : "text-left"
                }`}>
                {isOwnMessage
                  ? "Вы"
                  : message.sender.username || message.sender.email}
              </div>
              {renderMessageContent()}
              <div className="flex flex-row-reverse gap-2 mt-1">
                <span
                  className={`text-xs opacity-75 ${
                    isOwnMessage ? "text-right mt-1.5" : "text-left"
                  }`}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
                <ReadStatus message={message} currentUser={currentUser} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MessageItem.displayName = "MessageItem";

export default MessageItem;
