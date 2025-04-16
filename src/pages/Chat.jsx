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

const MediaViewer = React.lazy(() => import("../components/MediaViewer"));
const ProfileEditor = React.lazy(() => import("../components/ProfileEditor"));

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [unreadCounts, setUnreadCounts] = useState({ general: 0 });
  const { user, updateUser } = useAuth();

  // Добавляем состояние для отображения профиля пользователя
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

  const handleMediaClick = (mediaUrl, mediaType) => {
    startTransition(() => {
      setFullscreenMedia({
        url: `${import.meta.env.VITE_API_URL}${mediaUrl}`,
        type: mediaType,
      });
    });
  };

  const handleUserSelect = (user) => {
    // Добавляем класс для анимации выхода
    const container = document.querySelector(".messages-container");
    container?.classList.add("transitioning");

    // Задержка для анимации
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
    }, 300);
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

      setError("");
    } catch (error) {
      setError("Ошибка при обновлении профиля");
      console.error("Profile update error:", error);
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
    } catch (error) {
      console.error("Ошибка при закреплении/откреплении сообщения:", error);
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
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
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
        />
      )}
    </div>
  );
};

export default Chat;
