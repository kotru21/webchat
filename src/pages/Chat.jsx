// src/pages/Chat.jsx
import React, { Suspense, useTransition, useCallback, lazy } from "react";
import { useAuth } from "@context/useAuth";
import ChatHeader from "@widgets/chat/ChatHeader.jsx";
import { MessagesList } from "@entities/message/ui/MessagesList.jsx";
import { SendMessageForm } from "@features/sendMessage/ui/SendMessageForm.jsx";
import { UserProfileWidget } from "@widgets/profile";
const ChatsList = lazy(() => import("@widgets/chats/ChatsList"));
import useChatFeature from "@features/messaging/facade/useChatFeature";
import { useEnsureChatSelection } from "@features/chats/model/useEnsureChatSelection";
import { notify } from "@features/notifications/notify";
import { useUIStore } from "@shared/store/uiStore";
import { useChatStore } from "@shared/store/chatStore";
import { resolvePeerId } from "@shared/lib/peerId";
import { useChatPageActions } from "./model/useChatPageActions";

const MediaViewer = React.lazy(() => import("@widgets/media/MediaViewer.jsx"));
const ProfileEditor = React.lazy(() =>
  import("@widgets/profile/ProfileEditor.jsx")
);

const Chat = () => {
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const fullscreenMedia = useUIStore((s) => s.fullscreenMedia);
  const openMedia = useUIStore((s) => s.openMedia);
  const closeMedia = useUIStore((s) => s.closeMedia);
  const isProfileEditorOpen = useUIStore((s) => s.isProfileEditorOpen);
  const openProfileEditor = useUIStore((s) => s.openProfileEditor);
  const closeProfileEditor = useUIStore((s) => s.closeProfileEditor);
  const [, startTransition] = useTransition();
  const { user, updateUser } = useAuth();
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);

  const showErrorMessage = useCallback((message, type = "error") => {
    notify(type, message);
  }, []);

  const { messages } = useChatFeature({
    onError: (msg) => showErrorMessage(msg),
  });
  const selectedUser = useChatStore((s) => s.selectedUser);
  const peerId = resolvePeerId(selectedUser);
  const { isLoading: chatsLoading, isEmpty: chatsEmpty } =
    useEnsureChatSelection();
  const { handleMediaClick, handleProfileUpdate } = useChatPageActions({
    currentUserId: user?.id,
    setSelectedUser,
    setSidebarOpen,
    openMedia,
    updateUser,
    closeProfileEditor,
    startTransition,
    showMessage: showErrorMessage,
  });

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Перейти к чату
      </a>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-accent/25 blur-3xl" />
      </div>

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-pointer bg-foreground/25 backdrop-blur-[1px] md:hidden"
          aria-label="Закрыть список чатов"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="relative z-30 flex-none md:w-76 lg:w-84">
        <Suspense
          fallback={
            <div
              className="m3-surface-high flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse md:rounded-r-3xl md:border-r md:border-border/70"
              role="status">
              Загрузка чатов...
            </div>
          }>
          <ChatsList
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </Suspense>
      </div>

      <main
        id="main-content"
        className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:m-4 md:rounded-4xl md:border md:border-border/70 md:bg-card/75 md:backdrop-blur-md md:m3-elev-1">
        <ChatHeader
          user={user}
          emptyTitle={
            chatsEmpty
              ? "Найдите собеседника"
              : chatsLoading
                ? "Загрузка…"
                : "Выберите чат"
          }
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenProfileEditor={() => {
            startTransition(() => {
              openProfileEditor();
            });
          }}
        />

        {peerId ? (
          <>
            <MessagesList
              messages={messages}
              currentUser={user}
              onMediaClick={handleMediaClick}
              ProfileWidgetComponent={UserProfileWidget}
            />
            <SendMessageForm receiverId={peerId} />
          </>
        ) : chatsLoading ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center"
            role="status">
            <p className="text-sm text-muted-foreground animate-pulse">
              Загрузка чатов…
            </p>
          </div>
        ) : chatsEmpty ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-base font-medium text-foreground">
              У вас пока нет диалогов
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Найдите пользователя по нику в списке слева и отправьте первое
              сообщение.
            </p>
          </div>
        ) : (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center"
            role="status">
            <p className="text-sm text-muted-foreground animate-pulse">
              Открываем чат…
            </p>
          </div>
        )}
      </main>
      {fullscreenMedia && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
              role="status">
              <div className="text-lg text-white">Загрузка медиа...</div>
            </div>
          }>
          <MediaViewer
            key={fullscreenMedia.url}
            media={fullscreenMedia}
            onClose={() => closeMedia()}
          />
        </Suspense>
      )}
      {isProfileEditorOpen && (
        <Suspense
          fallback={
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              role="status">
              <div className="text-lg text-foreground">
                Загрузка редактора профиля...
              </div>
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
    </div>
  );
};

export default Chat;
