// src/pages/Chat.jsx
import React, { useState, useEffect, Suspense, useTransition } from "react";
import { useAuth } from "../context/AuthContext";
import ChatHeader from "../components/Chat/ChatHeader";
import ChatMessages from "../components/Chat/ChatMessages";
import ChatInput from "../components/Chat/ChatInput";
import ChatsList from "../components/ChatsList";
import useChatSocket from "../hooks/useChatSocket";
import useChatMessages from "../hooks/useChatMessages";
import { updateProfile } from "../services/api.js";
import api from "../services/api.js";
import { ANIMATION_DELAYS } from "../constants/appConstants";
import UserProfile from "../components/UserProfile";
import { FiAlertCircle, FiX } from "react-icons/fi";

const MediaViewer = React.lazy(() => import("../components/media/MediaViewer"));
const ProfileEditor = React.lazy(() => import("../components/ProfileEditor"));

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [unreadCounts, setUnreadCounts] = useState({ general: 0 });
  const { user, updateUser } = useAuth();
  const [errorInfo, setErrorInfo] = useState({
    message: "",
    visible: false,
    type: "error",
  });
  const [errorTimeout, setErrorTimeout] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [isProfileReversed, setIsProfileReversed] = useState(false);

  const {
    messages,
    setMessages,
    loading,
    error,
    setError,
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
  } = useChatMessages(selectedUser);

  const { onlineUsers } = useChatSocket({
    user,
    selectedUser,
    setMessages,
    setUnreadCounts,
  });

  const showErrorMessage = (message, type = "error") => {
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }

    setErrorInfo({ message, visible: true, type });

    const timeout = setTimeout(() => {
      setErrorInfo((prev) => ({ ...prev, visible: false }));
    }, 5000);

    setErrorTimeout(timeout);
  };

  // Очистка таймаута при размонтировании компонента
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [errorTimeout]);

  // Синхронизация с ошибками из useChatMessages
  useEffect(() => {
    if (error) {
      showErrorMessage(error);
      setError("");
    }
  }, [error, setError]);

  const handleMediaClick = (mediaUrl, mediaType) => {
    startTransition(() => {
      setFullscreenMedia({
        url: `${import.meta.env.VITE_API_URL}${mediaUrl}`,
        type: mediaType,
      });
    });
  };

  const handleUserSelect = (user) => {
    const container = document.querySelector(".messages-container");
    container?.classList.add("transitioning");

    setTimeout(() => {
      setSelectedUser(user);
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        user ? delete newCounts[user.id] : (newCounts.general = 0);
        return newCounts;
      });

      setTimeout(() => {
        container?.classList.remove("transitioning");
      }, 50);
    }, ANIMATION_DELAYS.CHAT_TRANSITION);
  };

  const handleProfileUpdate = async (formData) => {
    try {
      const response = await updateProfile(formData);
      const updatedUser = response?.user || response;
      if (updatedUser && updatedUser.id) {
        updateUser(updatedUser);
      } else {
        const userResponse = await api.get("/api/auth/me");
        updateUser(userResponse.data);
      }

      startTransition(() => {
        setIsProfileEditorOpen(false);
      });

      showErrorMessage("Профиль успешно обновлен", "success");
    } catch (error) {
      console.error("Profile update error:", error);

      if (error.response) {
        switch (error.response.status) {
          case 400:
            showErrorMessage("Некорректные данные для обновления профиля");
            break;
          case 413:
            showErrorMessage("Загружаемый файл слишком большой");
            break;
          case 415:
            showErrorMessage("Неподдерживаемый формат файла");
            break;
          case 429:
            showErrorMessage(
              "Слишком много запросов. Пожалуйста, повторите позже"
            );
            break;
          default:
            showErrorMessage("Ошибка при обновлении профиля. Попробуйте позже");
        }
      } else if (error.request) {
        showErrorMessage(
          "Сервер не отвечает. Проверьте подключение к интернету"
        );
      } else {
        showErrorMessage("Ошибка при обновлении профиля");
      }
    }
  };

  const handlePinMessage = async (messageId, isPinned) => {
    try {
      await api.put(`/api/messages/${messageId}/pin`, { isPinned });
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, isPinned } : msg
        )
      );

      showErrorMessage(
        isPinned ? "Сообщение закреплено" : "Сообщение откреплено",
        "success"
      );
    } catch (error) {
      console.error("Ошибка при закреплении/откреплении сообщения:", error);

      // Более информативные ошибки
      if (error.response?.status === 403) {
        showErrorMessage("У вас нет прав для закрепления этого сообщения");
      } else if (error.response?.status === 429) {
        showErrorMessage("Слишком много запросов. Пожалуйста, повторите позже");
      } else {
        showErrorMessage("Не удалось изменить статус закрепления сообщения");
      }

      throw error;
    }
  };

  const handleStartChat = (user) => {
    if (user) {
      setIsSidebarOpen(false); // Закрываем сайдбар на мобильных
      handleUserSelect(user); // Используем существующий обработчик
    }
  };

  // Обработчик для закрытия профиля
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  // Обработчик для закрытия сообщения об ошибке вручную
  const handleCloseError = () => {
    setErrorInfo((prev) => ({ ...prev, visible: false }));
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      console.log("Sending user_connected with:", user);
    } else {
      console.error("User data is incomplete:", user);
    }
  }, [user]);

  useEffect(() => {
    const socket = api.io;
    if (socket) {
      socket.on("message_pinned", ({ messageId, isPinned }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, isPinned } : msg
          )
        );
      });
    }
    return () => {
      if (socket) socket.off("message_pinned");
    };
  }, [setMessages]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-none md:w-72">
        <ChatsList
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          unreadCounts={unreadCounts}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <ChatHeader
          user={user}
          selectedUser={selectedUser}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenProfileEditor={() => {
            startTransition(() => {
              setIsProfileEditorOpen(true);
            });
          }}
        />

        {/* Улучшенное сообщение об ошибке/успехе */}
        {errorInfo.visible && (
          <div
            className={`mx-4 mt-2 p-3 rounded-lg flex items-center justify-between animate-fade-in ${
              errorInfo.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            }`}
            role="alert">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2 flex-shrink-0" />
              <span className="block sm:inline">{errorInfo.message}</span>
            </div>
            <button
              onClick={handleCloseError}
              className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <FiX size={18} />
            </button>
          </div>
        )}

        <ChatMessages
          messages={messages}
          currentUser={user}
          onMarkAsRead={markAsReadHandler}
          onEditMessage={editMessageHandler}
          onDeleteMessage={deleteMessageHandler}
          onMediaClick={handleMediaClick}
          onPinMessage={handlePinMessage}
          onStartChat={handleStartChat} // Добавляем обработчик для начала чата
        />
        <ChatInput onSendMessage={sendMessageHandler} loading={loading} />
      </div>
      {fullscreenMedia && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
              <div className="text-white text-lg">Загрузка медиа...</div>
            </div>
          }>
          <MediaViewer
            media={fullscreenMedia}
            onClose={() => setFullscreenMedia(null)}
          />
        </Suspense>
      )}
      {isProfileEditorOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 z-50">
              <div className="text-lg">Загрузка редактора профиля...</div>
            </div>
          }>
          <ProfileEditor
            user={user}
            onSave={handleProfileUpdate}
            onClose={() => {
              startTransition(() => {
                setIsProfileEditorOpen(false);
              });
            }}
          />
        </Suspense>
      )}
      {isProfileOpen && (
        <UserProfile
          userId={profileUserId}
          onClose={handleCloseProfile}
          onStartChat={handleStartChat} // Добавляем обработчик для начала чата
          anchorEl={profileAnchorEl}
          containerClassName="mt-2"
          isReversed={isProfileReversed}
          currentUserId={user?.id} // Передаем ID текущего пользователя
        />
      )}
    </div>
  );
};

export default Chat;
