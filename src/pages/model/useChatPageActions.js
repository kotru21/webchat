import { useCallback } from "react";
import { updateProfile } from "@features/auth/api/authApi";
import apiClient from "@shared/api/client";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";

const PROFILE_UPDATE_ERRORS = Object.freeze({
  400: "Некорректные данные для обновления профиля",
  413: "Загружаемый файл слишком большой",
  415: "Неподдерживаемый формат файла",
  429: "Слишком много запросов. Пожалуйста, повторите позже",
});

const resolveUpdatedUser = async (response) => {
  const updatedUser = response?.user || response;
  if (updatedUser?.id) {
    return updatedUser;
  }

  const userResponse = await apiClient.get("/api/auth/me");
  return userResponse.data;
};

const getProfileUpdateErrorMessage = (error) => {
  if (error?.response) {
    return (
      PROFILE_UPDATE_ERRORS[error.response.status] ||
      "Ошибка при обновлении профиля. Попробуйте позже"
    );
  }

  if (error?.request) {
    return "Сервер не отвечает. Проверьте подключение к интернету";
  }

  return "Ошибка при обновлении профиля";
};

export function useChatPageActions({
  currentUserId,
  setSelectedUser,
  setSidebarOpen,
  openMedia,
  updateUser,
  closeProfileEditor,
  startTransition,
  showMessage,
}) {
  const handleMediaClick = useCallback(
    (mediaUrl, mediaType) => {
      startTransition(() => {
        openMedia({
          url: toAbsoluteMediaUrl(mediaUrl),
          type: mediaType,
        });
      });
    },
    [openMedia, startTransition]
  );

  const handleProfileUpdate = useCallback(
    async (formData) => {
      try {
        const response = await updateProfile(formData);
        const updatedUser = await resolveUpdatedUser(response);
        updateUser(updatedUser);

        startTransition(() => {
          closeProfileEditor();
        });

        showMessage("Профиль успешно обновлен", "success");
      } catch (error) {
        showMessage(getProfileUpdateErrorMessage(error));
      }
    },
    [closeProfileEditor, showMessage, startTransition, updateUser]
  );

  const handleStartChat = useCallback(
    (target) => {
      if (!target?.id || target.id === currentUserId) {
        return;
      }

      setSelectedUser({
        id: target.id,
        username: target.username,
        avatar: target.avatar,
        email: target.email,
      });

      setSidebarOpen(false);
    },
    [currentUserId, setSelectedUser, setSidebarOpen]
  );

  return {
    handleMediaClick,
    handleProfileUpdate,
    handleStartChat,
  };
}

export default useChatPageActions;
