// src/pages/Chat.jsx
import React, {
  useState,
  Suspense,
  useTransition,
  useCallback,
  lazy,
} from "react";
import { useAuth } from "@context/useAuth";
import ChatHeader from "@widgets/chat/ChatHeader.jsx";
import { MessagesList } from "@entities/message/ui/MessagesList.jsx";
import { SendMessageForm } from "@features/sendMessage/ui/SendMessageForm.jsx";
const ChatsList = lazy(() => import("@widgets/chats/ChatsList"));
import useChatFeature from "@features/messaging/facade/useChatFeature";
import { updateProfile } from "@features/auth/api/authApi";
import { ANIMATION_DELAYS } from "../constants/appConstants";
import { notify } from "@shared/lib/eventBus/notify";
import ToastContainer from "@widgets/notifications/ToastContainer.jsx";

const MediaViewer = React.lazy(() => import("@widgets/media/MediaViewer.jsx"));
const ProfileEditor = React.lazy(() =>
  import("@widgets/profile/ProfileEditor.jsx")
);

const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [unreadCounts, setUnreadCounts] = useState({ general: 0 });
  const { user, updateUser } = useAuth();

  // Профиль пользователя будет вынесен в отдельный контейнер позже

  const { messages, loading, api } = useChatFeature(selectedUser, {
    onError: (msg) => showErrorMessage(msg),
  });

  const showErrorMessage = useCallback((message, type = "error") => {
    notify(type, message);
  }, []);

  // Очистка таймаута при размонтировании компонента
  // таймеры теперь управляются ToastContainer

  // ошибки теперь приходят через фасад onError

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

  const handleStartChat = (user) => {
    if (user) {
      setIsSidebarOpen(false); // Закрываем сайдбар на мобильных
      handleUserSelect(user); // Используем существующий обработчик
    }
  };

  // TODO: профиль вынести в отдельный слой (виджет + usecase)

  // ручное закрытие не требуется — есть dismiss в ToastContainer

  // удалён временный лог user_connected

  // socket pin updates теперь идут через store

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
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
            onClose={() => setIsSidebarOpen(false)}
            onUserSelect={handleUserSelect}
            selectedUser={selectedUser}
            unreadCounts={unreadCounts}
          />
        </Suspense>
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
        <SendMessageForm onSendMessage={api.send} loading={loading} />
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
      {/* Toasts */}
      <ToastContainer />
      {/* Профиль пользователя временно отключен */}
    </div>
  );
};

export default Chat;
