import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
  updateProfile,
} from "../services/api";
import io from "socket.io-client";
import UsersList from "../components/UsersList";
import ReadStatus from "../components/ReadStatus";
import MessageEditor from "../components/MessageEditor";
import MediaViewer from "../components/MediaViewer";
import ProfileEditor from "../components/ProfileEditor";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({
    general: 0,
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(selectedUser?.id);

        // Локально помечаем сообщения как прочитанные
        const updatedMessages = data.map((message) => {
          if (
            message.sender._id !== user.id &&
            !message.readBy?.some((reader) => reader._id === user.id)
          ) {
            return {
              ...message,
              readBy: [...(message.readBy || []), { _id: user.id }],
            };
          }
          return message;
        });
        setMessages(updatedMessages);

        // Отправляем запросы на сервер для подтверждения
        const unreadMessages = data.filter(
          (message) =>
            message.sender._id !== user.id &&
            !message.readBy?.some((reader) => reader._id === user.id)
        );

        for (const message of unreadMessages) {
          try {
            await markMessageAsRead(message._id);
          } catch (error) {
            console.error("Ошибка при отметке сообщения:", error);
          }
        }

        setError("");
      } catch (error) {
        setError("Ошибка при загрузке сообщений");
        console.error("Ошибка при загрузке сообщений:", error);
      }
    };
    fetchMessages();
  }, [selectedUser, user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join_room", "general");
      socket.emit("user_connected", {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
    });

    socket.on("receive_message", (newMessage) => {
      if (newMessage.sender._id === user.id) {
        if (!selectedUser) {
          setMessages((prev) => [...prev, newMessage]);
        }
        return;
      }

      if (!selectedUser) {
        setMessages((prev) => [...prev, newMessage]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          general: (prev.general || 0) + 1,
        }));
      }
    });

    socket.on("receive_private_message", (newMessage) => {
      const isCurrentChat =
        selectedUser &&
        (newMessage.sender._id === selectedUser.id ||
          newMessage.receiver === selectedUser.id);

      if (
        isCurrentChat ||
        newMessage.sender._id === user.id ||
        newMessage.receiver === user.id
      ) {
        setMessages((prev) => [...prev, newMessage]);
      } else if (newMessage.sender._id !== user.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.sender._id]: (prev[newMessage.sender._id] || 0) + 1,
        }));
      }
    });

    socket.on("users_online", (users) => {
      setOnlineUsers(users);
    });

    socket.on("message_read", ({ messageId, readBy }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, readBy } : msg))
      );
    });

    socket.on("message_updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on("message_deleted", (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUser, user.id]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedFile(file);
    } else {
      setError("Файл слишком большой (максимум 50MB)");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("text", newMessage);
      if (selectedFile) formData.append("media", selectedFile);
      if (selectedUser) formData.append("receiverId", selectedUser.id);

      await sendMessage(formData);
      setNewMessage("");
      setSelectedFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      setError("Ошибка при отправке сообщения");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageView = async (message) => {
    if (!message.readBy?.some((reader) => reader._id === user.id)) {
      try {
        await markMessageAsRead(message._id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === message._id
              ? { ...msg, readBy: [...(msg.readBy || []), { _id: user.id }] }
              : msg
          )
        );
        setUnreadCounts((prev) => {
          const newCounts = { ...prev };
          if (message.isPrivate) {
            const senderId = message.sender._id;
            newCounts[senderId] = Math.max((newCounts[senderId] || 0) - 1, 0);
          } else {
            newCounts.general = Math.max((newCounts.general || 0) - 1, 0);
          }
          return newCounts;
        });
      } catch (error) {
        console.error("Ошибка при отметке сообщения:", error);
      }
    }
  };

  // Остальные функции (handleEditMessage, handleDeleteMessage, и т.д.) остаются без изменений

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            const message = messages.find((m) => m._id === messageId);
            if (message) handleMessageView(message);
          }
        });
      },
      { threshold: 1.0 }
    );

    const messageElements = document.querySelectorAll(".message-item");
    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
  }, [messages]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      user ? delete newCounts[user.id] : (newCounts.general = 0);
      return newCounts;
    });
  };

  const renderMessageContent = (message) => (
    <>
      {message.content && (
        <div className="flex flex-col">
          <p
            className={`text-sm break-words ${
              message.sender._id === user.id ? "text-right" : "text-left"
            }`}>
            {message.content}
          </p>
          {(message.isEdited || message.isDeleted) && (
            <span
              className={`text-xs  ${
                message.sender._id === user.id
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
            onClick={() => handleMediaClick(message.mediaUrl, "image")}
          />
        )}
      {!message.isDeleted &&
        message.mediaUrl &&
        message.mediaType === "video" && (
          <video
            src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
            className="max-w-[400px] max-h-[400px] rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleMediaClick(message.mediaUrl, "video")}>
            Ваш браузер не поддерживает видео.
          </video>
        )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Оверлей для мобильного меню */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-none md:w-72">
        <UsersList
          users={onlineUsers.filter((u) => u.id !== user.id)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
          unreadCounts={unreadCounts}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden text-gray-600 dark:text-gray-300">
                ☰
              </button>
              <h1 className="text-xl font-semibold">
                {selectedUser
                  ? `Чат с ${selectedUser.username || selectedUser.email}`
                  : "Общий чат"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={
                    user.avatar
                      ? `${import.meta.env.VITE_API_URL}${user.avatar}`
                      : "/default-avatar.png"
                  }
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80"
                  onClick={() => setIsProfileEditorOpen(true)}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.username || user.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden pb-20">
          {messages.map((message) => (
            <div
              key={message._id}
              data-message-id={message._id}
              className={`flex message-item ${
                message.sender._id === user.id ? "justify-end" : "justify-start"
              }`}>
              {editingMessage?._id === message._id ? (
                <MessageEditor
                  message={message}
                  onSave={(formData) =>
                    handleEditMessage(message._id, formData)
                  }
                  onCancel={() => setEditingMessage(null)}
                />
              ) : (
                <div className="message-container group relative">
                  <div className="pt-8">
                    {message.sender._id === user.id && (
                      <div className="absolute -top-2 right-10 hidden group-hover:flex gap-3 bg-white dark:bg-gray-800 py-2 px-4 rounded-md shadow-lg transition-all duration-200 z-10">
                        <button
                          onClick={() => setEditingMessage(message)}
                          className="text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400">
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400">
                          Удалить
                        </button>
                      </div>
                    )}

                    <div
                      className={`flex items-start ${
                        message.sender._id === user.id
                          ? "flex-row-reverse"
                          : "flex-row"
                      } gap-2 `}>
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
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />

                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.sender._id === user.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            message.sender._id === user.id
                              ? "text-right"
                              : "text-left"
                          }`}>
                          {message.sender._id === user.id
                            ? "Вы"
                            : message.sender.username || message.sender.email}
                        </div>
                        {renderMessageContent(message)}
                        <div className="flex flex-row-reverse gap-2 mt-1">
                          <span
                            className={`text-xs opacity-75 ${
                              message.sender._id === user.id
                                ? "text-right mt-1.5"
                                : "text-left"
                            }`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                          <ReadStatus message={message} currentUser={user} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2 sm:p-4 pb-10 lg:pb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Сообщение..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-w-0"
              disabled={loading}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*, video/mp4, video/webm"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0">
              📎
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0 pl-6 pr-6 md:pr-2 md:pl-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 text-xs text-gray-500 truncate px-2">
              Файл: {selectedFile.name}
            </div>
          )}
        </form>
      </div>
      {fullscreenMedia && (
        <MediaViewer
          media={fullscreenMedia}
          onClose={() => setFullscreenMedia(null)}
        />
      )}
      {isProfileEditorOpen && (
        <ProfileEditor
          user={user}
          onSave={handleProfileUpdate}
          onClose={() => setIsProfileEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default Chat;
