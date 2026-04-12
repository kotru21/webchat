import { memo, useCallback } from "react";
import { FiX, FiUsers } from "react-icons/fi";
import { useUserChats } from "@features/chats/api/useUserChats";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { toAbsoluteMediaUrl } from "@shared/lib/mediaUrl";
import { Button } from "@shared/ui/button";

import { useChatStore } from "@shared/store/chatStore";

const ChatsList = memo(({ isOpen, onClose }) => {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const resetUnread = useChatStore((s) => s.resetUnread);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const { data: chats = [], isLoading: loading, error } = useUserChats();
  const formatMessageTime = useCallback(
    (d) =>
      d
        ? formatDistanceToNow(new Date(d), { addSuffix: true, locale: ru })
        : "",
    []
  );
  const formatLastMessage = useCallback((m) => {
    if (!m) return "Нет сообщений";
    if (m.isDeleted) return "Сообщение удалено";
    if (m.mediaUrl)
      return m.mediaType === "image" ? "🖼️ Изображение" : "🎬 Видео";
    return m.content.length > 25 ? m.content.slice(0, 25) + "..." : m.content;
  }, []);
  const handleSelectGeneral = () => {
    setSelectedUser(null);
    resetUnread("general");
  };
  const handleSelectUser = (chat) => {
    setSelectedUser({
      id: chat.user._id,
      username: chat.user.username,
      avatar: chat.user.avatar,
      email: chat.user.email,
    });
    resetUnread(chat.user._id);
  };

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 z-30 h-full w-76 m3-surface-high border-r border-border/70 transition-transform duration-300 ease-in-out md:relative md:inset-auto md:w-full md:translate-x-0 md:rounded-r-4xl md:m3-elev-1`}>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Чаты</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Закрыть список чатов">
            <FiX size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto pr-1">
          <div
            onClick={handleSelectGeneral}
            className={`mb-1 flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-3 transition-all duration-200 hover:border-primary/35 hover:bg-card/70 ${
              !selectedUser
                ? "border-primary/45 bg-primary/10"
                : "border-transparent"
            }`}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-primary to-sky-400 text-primary-foreground shadow-[0_2px_8px_hsl(var(--shadow-color)/0.2)]">
                <FiUsers size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">Общий чат</p>
                <p className="text-xs text-muted-foreground truncate">
                  Чат для всех пользователей
                </p>
              </div>
            </div>
            {unreadCounts["general"] > 0 && (
              <span className="m3-pill ml-2 min-w-6 bg-destructive px-2 py-1 text-center text-xs text-destructive-foreground">
                {unreadCounts["general"]}
              </span>
            )}
          </div>

          <div className="my-3 border-t border-border/70" />

          <h3 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Личные сообщения
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex animate-pulse space-x-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-3 text-center text-sm text-destructive">{error}</div>
          ) : chats.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground text-sm">
              У вас пока нет личных чатов
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.user._id}
                onClick={() => handleSelectUser(chat)}
                className={`mb-1 cursor-pointer rounded-2xl border px-3 py-3 transition-all duration-200 hover:border-primary/35 hover:bg-card/70 ${
                  selectedUser?.id === chat.user._id
                    ? "border-primary/45 bg-primary/10"
                    : "border-transparent"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={
                          toAbsoluteMediaUrl(chat.user.avatar) ||
                          "/default-avatar.png"
                        }
                        alt={chat.user.username}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-border/70"
                        onError={(e) => {
                          if (e.currentTarget.src.endsWith("/default-avatar.png"))
                            return;
                          e.currentTarget.src = "/default-avatar.png";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {chat.user.username || chat.user.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatLastMessage(chat.lastMessage)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMessageTime(chat.lastMessage?.createdAt)}
                      </p>
                    </div>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="m3-pill ml-2 min-w-6 bg-destructive px-2 py-1 text-center text-xs text-destructive-foreground">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

ChatsList.displayName = "ChatsList";
export default ChatsList;
