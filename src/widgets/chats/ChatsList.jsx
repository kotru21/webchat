import { memo, useCallback } from "react";
import StatusIndicator from "@entities/status/ui/StatusIndicator";
import { FiX, FiUsers } from "react-icons/fi";
import { useUserChats } from "@features/chats/api/useUserChats";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

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
      status: chat.user.status,
      email: chat.user.email,
    });
    resetUnread(chat.user._id);
  };

  return (
    <div
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed md:relative md:translate-x-0 h-full w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300 ease-in-out z-20`}>
      <div className="p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Чаты</h2>
          <button
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <FiX size={18} />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin h-[calc(100%-4rem)] overflow-x-hidden">
          <div
            onClick={handleSelectGeneral}
            className={`p-3 cursor-pointer rounded-lg flex items-center justify-between transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 ${
              !selectedUser
                ? "bg-blue-500/10 border-blue-500/80"
                : "border-transparent"
            }`}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white">
                <FiUsers size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Общий чат</p>
                <p className="text-xs text-gray-500 truncate">
                  Чат для всех пользователей
                </p>
              </div>
            </div>
            {unreadCounts["general"] > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                {unreadCounts["general"]}
              </span>
            )}
          </div>
          <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
          <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 px-3 mb-1">
            Личные сообщения
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse flex space-x-3">
                <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-3 text-center text-red-500 text-sm">{error}</div>
          ) : chats.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">
              У вас пока нет личных чатов
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.user._id}
                onClick={() => handleSelectUser(chat)}
                className={`p-3 cursor-pointer rounded-lg transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 ${
                  selectedUser?.id === chat.user._id
                    ? "bg-blue-500/10 border-blue-500/80"
                    : "border-transparent"
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          chat.user.avatar
                            ? `${import.meta.env.VITE_API_URL}${
                                chat.user.avatar
                              }`
                            : "/default-avatar.png"
                        }
                        alt={chat.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                      <StatusIndicator
                        status={chat.user.status || "offline"}
                        size="sm"
                        customClass="absolute -top-4 -right-7"
                      />
                    </div>
                    <div className="flex-1 min-w-0 -mt-4">
                      <p className="text-sm font-medium truncate">
                        {chat.user.username || chat.user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatLastMessage(chat.lastMessage)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMessageTime(chat.lastMessage?.createdAt)}
                      </p>
                    </div>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
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
