// src/pages/Chat.jsx
import React, { Suspense, useTransition, useCallback, lazy } from "react";
import { useAuth } from "@context/useAuth";
import ChatHeader from "@widgets/chat/ChatHeader.jsx";
import { MessagesList } from "@entities/message/ui/MessagesList.jsx";
import { SendMessageForm } from "@features/sendMessage/ui/SendMessageForm.jsx";
const ChatsList = lazy(() => import("@widgets/chats/ChatsList"));
import useChatFeature from "@features/messaging/facade/useChatFeature";
import { updateProfile } from "@features/auth/api/authApi";
import { notify } from "@features/notifications/notify";
import ToastContainer from "@widgets/notifications/ToastContainer.jsx";
import apiClient from "@shared/api/client";
import { useUIStore } from "@shared/store/uiStore";
import { useChatStore } from "@shared/store/chatStore";

const MediaViewer = React.lazy(() => import("@widgets/media/MediaViewer.jsx"));
const ProfileEditor = React.lazy(() =>
  import("@widgets/profile/ProfileEditor.jsx")
);

const Chat = () => {
  // selectedUser теперь используется внутри useChatFeature напрямую из store
  // Раздельные селекторы, чтобы избежать создания нового объекта на каждый рендер
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const fullscreenMedia = useUIStore((s) => s.fullscreenMedia);
  const openMedia = useUIStore((s) => s.openMedia);
  const closeMedia = useUIStore((s) => s.closeMedia);
  const isProfileEditorOpen = useUIStore((s) => s.isProfileEditorOpen);
  const openProfileEditor = useUIStore((s) => s.openProfileEditor);
  const closeProfileEditor = useUIStore((s) => s.closeProfileEditor);
  const [, startTransition] = useTransition();
  // unreadCounts теперь в zustand (chatStore)
  const { user, updateUser } = useAuth();
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);

  // Профиль пользователя будет вынесен в отдельный контейнер позже

  const showErrorMessage = useCallback((message, type = "error") => {
    notify(type, message);
  }, []);

  const { messages, api } = useChatFeature({
    onError: (msg) => showErrorMessage(msg),
  });
  const selectedUser = useChatStore((s) => s.selectedUser);

  const handleMediaClick = (mediaUrl, mediaType) => {
    startTransition(() => {
      openMedia({
        url: `${import.meta.env.VITE_API_URL}${mediaUrl}`,
        type: mediaType,
      });
    });
  };

  const handleProfileUpdate = async (formData) => {
    try {
      const response = await updateProfile(formData);
      const updatedUser = response?.user || response;
      if (updatedUser && updatedUser.id) {
        updateUser(updatedUser);
      } else {
        const userResponse = await apiClient.get("/api/auth/me");
        updateUser(userResponse.data);
      }

      startTransition(() => {
        closeProfileEditor();
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

  const handleStartChat = useCallback(
    (target) => {
      if (!target || !target.id || target.id === user.id) return;
      setSelectedUser({
        id: target.id,
        username: target.username,
        avatar: target.avatar,
        email: target.email,
        status: target.status,
      });
      // На мобильных можно закрыть сайдбар, если открыт профиль
      setSidebarOpen(false);
    },
    [setSelectedUser, setSidebarOpen, user.id]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-none md:w-72">
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              Загрузка чатов...
            </div>
          }>
          <ChatsList
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </Suspense>
      </div>

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <ChatHeader
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfileEditor={() => {
            startTransition(() => {
              openProfileEditor();
            });
          }}
        />

        <MessagesList
          messages={messages}
          currentUser={user}
          onMarkAsRead={api.markRead}
          onEditMessage={api.edit}
          onDeleteMessage={api.remove}
          onMediaClick={handleMediaClick}
          onPinMessage={api.pin}
          onStartChat={handleStartChat}
        />
        <SendMessageForm receiverId={selectedUser?.id || null} />
      </div>
      {fullscreenMedia && (
        <Suspense
          fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
              <div className="text-white text-lg">Загрузка медиа...</div>
            </div>
          }>
          <MediaViewer media={fullscreenMedia} onClose={() => closeMedia()} />
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
                closeProfileEditor();
              });
            }}
          />
        </Suspense>
      )}
      {/* Toasts */}
      <ToastContainer />
    </div>
  );
};

export default Chat;
