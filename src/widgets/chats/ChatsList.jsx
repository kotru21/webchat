import { memo, useCallback, useEffect, useState } from "react";
import { FiImage, FiSearch, FiVideo, FiX } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useUserChats } from "@features/chats/api/useUserChats";
import { useUserSearch } from "@features/chats/api/useUserSearch";
import { useChatStore } from "@shared/store/chatStore";
import { resolvePeerId } from "@shared/lib/peerId";
import { AuthorizedMediaImg } from "@shared/ui/AuthorizedMediaImg";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";

function useIsMobileDrawer() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

const ChatsList = memo(({ isOpen, onClose }) => {
  const selectedUser = useChatStore((s) => s.selectedUser);
  const setSelectedUser = useChatStore((s) => s.setSelectedUser);
  const resetUnread = useChatStore((s) => s.resetUnread);
  const unreadCounts = useChatStore((s) => s.unreadCounts);
  const selectedPeerId = resolvePeerId(selectedUser);
  const { data: chats = [], isLoading: loading, error } = useUserChats();
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedQuery = searchQuery.trim();
  const {
    data: searchResults = [],
    isFetching: searchLoading,
    isError: searchError,
  } = useUserSearch(trimmedQuery);
  const isMobile = useIsMobileDrawer();
  const drawerHidden = isMobile && !isOpen;

  const formatMessageTime = useCallback(
    (d) =>
      d
        ? formatDistanceToNow(new Date(d), { addSuffix: true, locale: ru })
        : "",
    []
  );

  const formatLastMessage = useCallback((m) => {
    if (!m) return "Нет сообщений";
    if (m.mediaUrl) {
      if (m.mediaType === "image") {
        return (
          <span className="inline-flex items-center gap-1">
            <FiImage size={12} aria-hidden className="shrink-0" />
            Изображение
          </span>
        );
      }
      if (m.mediaType === "video") {
        return (
          <span className="inline-flex items-center gap-1">
            <FiVideo size={12} aria-hidden className="shrink-0" />
            Видео
          </span>
        );
      }
      return "Медиа";
    }
    return m.content.length > 25 ? m.content.slice(0, 25) + "..." : m.content;
  }, []);

  const openPeer = useCallback(
    (user) => {
      const peerId = resolvePeerId(user);
      if (!peerId) return;
      setSelectedUser({
        id: peerId,
        username: user.username,
        avatar: user.avatar,
      });
      resetUnread(peerId);
      setSearchQuery("");
      onClose?.();
    },
    [onClose, resetUnread, setSelectedUser]
  );

  const handleSelectChat = useCallback(
    (chat) => {
      openPeer(chat.user);
    },
    [openPeer]
  );

  return (
    <nav
      aria-label="Список чатов"
      aria-hidden={drawerHidden || undefined}
      inert={drawerHidden || undefined}
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 z-30 h-full w-76 m3-surface-high border-r border-border/70 transition-transform duration-300 ease-in-out md:relative md:inset-auto md:w-full md:translate-x-0 md:rounded-r-4xl md:m3-elev-1`}>
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex min-h-12 items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Kotikov
            </p>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Чаты
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-12 w-12 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Закрыть список чатов">
            <FiX size={18} />
          </Button>
        </div>

        <div className="relative mb-4">
          <FiSearch
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
            aria-hidden
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Найти пользователя…"
            className="h-12 pl-11 pr-12"
            aria-label="Поиск пользователей"
            autoComplete="off"
          />
          {searchQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 text-muted-foreground"
              onClick={() => setSearchQuery("")}
              aria-label="Очистить поиск">
              <FiX size={14} />
            </Button>
          ) : null}
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {trimmedQuery ? (
            <>
              <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Результаты поиска
              </h3>
              {searchLoading ? (
                <div
                  className="p-4 text-center text-sm text-muted-foreground animate-pulse"
                  role="status">
                  Поиск…
                </div>
              ) : searchError ? (
                <div className="p-4 text-center text-sm text-destructive" role="alert">
                  Не удалось выполнить поиск
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Никого не найдено
                </div>
              ) : (
                <ul className="list-none p-0" role="list">
                  {searchResults.map((user) => {
                    const peerId = resolvePeerId(user);
                    const selected = selectedPeerId === peerId;
                    return (
                      <li key={peerId}>
                        <button
                          type="button"
                          onClick={() => openPeer(user)}
                          aria-current={selected ? "true" : undefined}
                          className={`mb-2 flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:border-primary/35 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                            selected
                              ? "border-primary/45 bg-primary/10"
                              : "border-transparent"
                          }`}>
                          <AuthorizedMediaImg
                            src={user.avatar}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border/70"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-5">
                              {user.username}
                            </p>
                            <p className="truncate text-xs leading-4 text-muted-foreground">
                              Написать сообщение
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Личные сообщения
              </h3>

              {loading ? (
                <div
                  className="flex items-center justify-center py-4"
                  role="status"
                  aria-label="Загрузка чатов">
                  <div className="flex animate-pulse space-x-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive" role="alert">
                  {error}
                </div>
              ) : chats.length === 0 ? (
                <div className="space-y-2 p-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Начните диалог
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Найдите пользователя по нику в поле поиска выше и напишите
                    первое сообщение.
                  </p>
                </div>
              ) : (
                <ul className="list-none p-0" role="list">
                  {chats.map((chat) => {
                    const chatPeerId = resolvePeerId(chat.user);
                    const unread =
                      unreadCounts[chatPeerId] || chat.unreadCount || 0;
                    const selected = selectedPeerId === chatPeerId;
                    const label = [
                      chat.user.username,
                      unread > 0 ? `${unread} непрочитанных` : null,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <li key={chatPeerId}>
                        <button
                          type="button"
                          onClick={() => handleSelectChat(chat)}
                          aria-current={selected ? "true" : undefined}
                          aria-label={label}
                          className={`mb-2 flex min-h-16 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left transition-all duration-200 hover:border-primary/35 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
                            selected
                              ? "border-primary/45 bg-primary/10"
                              : "border-transparent"
                          }`}>
                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <div className="relative shrink-0">
                              <AuthorizedMediaImg
                                src={chat.user.avatar}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover ring-1 ring-border/70"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium leading-5">
                                {chat.user.username}
                              </p>
                              <p className="truncate text-xs leading-4 text-muted-foreground">
                                {formatLastMessage(chat.lastMessage)}
                              </p>
                              <p className="mt-1 text-xs leading-4 text-muted-foreground">
                                {formatMessageTime(chat.lastMessage?.createdAt)}
                              </p>
                            </div>
                          </div>

                          {unread > 0 && (
                            <span
                              className="m3-pill ml-2 min-w-6 bg-destructive px-2 py-1 text-center text-xs text-destructive-foreground"
                              aria-hidden>
                              {unread}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
});

ChatsList.displayName = "ChatsList";
export default ChatsList;
