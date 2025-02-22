import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
} from "../services/api";
import io from "socket.io-client";
import UsersList from "../components/UsersList";
import ReadStatus from "../components/ReadStatus";
import MessageEditor from "../components/MessageEditor";

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
        setMessages(data);
        setError("");
      } catch (error) {
        setError("Ошибка при загрузке сообщений");
        console.error("Ошибка при загрузке сообщений:", error);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("join_room", "general");
      socket.emit("join_private_room", user.id);
      socket.emit("user_connected", {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
    });

    socket.on("receive_message", (newMessage) => {
      if (!selectedUser) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        if (newMessage.sender._id !== user.id) {
          setUnreadCounts((prev) => ({
            ...prev,
            general: (prev.general || 0) + 1,
          }));
        }
      }
    });

    socket.on("receive_private_message", (newMessage) => {
      if (
        selectedUser &&
        (newMessage.sender._id === selectedUser.id ||
          newMessage.receiver._id === selectedUser.id)
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      } else if (newMessage.sender._id !== user.id) {
        // Обновляем счетчик непрочитанных для личных сообщений
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
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, readBy } : msg
        )
      );
    });

    socket.on("message_updated", (updatedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on("message_deleted", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUser]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError("Файл слишком большой (максимум 50MB)");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append("text", newMessage);
      }
      if (selectedFile) {
        formData.append("media", selectedFile);
      }
      if (selectedUser) {
        formData.append("receiverId", selectedUser.id);
      }

      await sendMessage(formData);
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setError("Ошибка при отправке сообщения");
      console.error("Ошибка при отправке сообщения:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageView = async (message) => {
    if (!message.readBy?.some((reader) => reader._id === user.id)) {
      try {
        await markMessageAsRead(message._id);
        // Обновляем счетчик непрочитанных сообщений
        setUnreadCounts((prev) => {
          const newCounts = { ...prev };
          if (message.isPrivate) {
            newCounts[message.sender._id] = Math.max(
              (newCounts[message.sender._id] || 0) - 1,
              0
            );
          } else {
            newCounts.general = Math.max((newCounts.general || 0) - 1, 0);
          }
          return newCounts;
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  const handleEditMessage = async (messageId, formData) => {
    try {
      const updatedMessage = await updateMessage(messageId, formData);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? updatedMessage : msg
        )
      );
      setEditingMessage(null);
    } catch (error) {
      setError("Ошибка при редактировании сообщения");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Вы уверены, что хотите удалить это сообщение?")) {
      try {
        const updatedMessage = await deleteMessage(messageId);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? updatedMessage : msg
          )
        );
      } catch (error) {
        setError("Ошибка при удалении сообщения");
      }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            const message = messages.find((m) => m._id === messageId);
            if (message) {
              handleMessageView(message);
            }
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

  useEffect(() => {
    const calculateUnreadCounts = () => {
      const counts = { general: 0 };

      messages.forEach((message) => {
        // Пропускаем сообщения, отправленные текущим пользователем
        if (message.sender._id === user.id) return;

        // Проверяем, прочитано ли сообщение текущим пользователем
        const isRead = message.readBy?.some((reader) => reader._id === user.id);
        if (!isRead) {
          if (message.isPrivate) {
            const chatId = message.sender._id;
            counts[chatId] = (counts[chatId] || 0) + 1;
          } else {
            counts.general++;
          }
        }
      });

      setUnreadCounts(counts);
    };

    calculateUnreadCounts();
  }, [messages]);

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
              className={`text-xs text-gray-500 ${
                message.sender._id === user.id ? "text-right" : "text-left"
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
            className="max-w-[300px] max-h-[300px] rounded-lg mt-2"
          />
        )}
      {!message.isDeleted &&
        message.mediaUrl &&
        message.mediaType === "video" && (
          <video
            controls
            className="max-w-[300px] max-h-[300px] rounded-lg mt-2">
            <source
              src={`${import.meta.env.VITE_API_URL}${message.mediaUrl}`}
              type="video/mp4"
            />
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

      {/* Боковое меню - изменен w-64 на w-72 и добавлены стили для корректного позиционирования */}
      <div className="flex-none md:w-72">
        <UsersList
          users={onlineUsers.filter((u) => u.id !== user.id)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onUserSelect={(user) => {
            setSelectedUser(user);
            // Сбрасываем счетчик непрочитанных сообщений при выборе чата
            setUnreadCounts((prev) => ({
              ...prev,
              [user ? user.id : "general"]: 0,
            }));
          }}
          selectedUser={selectedUser}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* Основной контент чата - добавлен flex-1 и min-w-0 для предотвращения переполнения */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6">
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
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user.email}
            </span>
          </div>
        </header>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4"
            role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 overflow-x-hidden">
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
                      <div className="absolute -top-2 right-20 hidden group-hover:flex gap-3 bg-white dark:bg-gray-800 py-2 px-4 rounded-md shadow-lg transition-all duration-200 z-10">
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
                      } gap-2 max-w-[85%]`}>
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
                        <div className="flex flex-col gap-1">
                          <span
                            className={`text-xs opacity-75 ${
                              message.sender._id === user.id
                                ? "text-right"
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
          className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
              📎
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}>
              {loading ? "Отправка..." : "Отправить"}
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 text-sm text-gray-500">
              Выбран файл: {selectedFile.name}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat;
