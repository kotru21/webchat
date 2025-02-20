import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage } from "../services/api";
import io from "socket.io-client";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages();
        setMessages(data);
        setError("");
      } catch (error) {
        setError("Ошибка при загрузке сообщений");
        console.error("Ошибка при загрузке сообщений:", error);
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const socket = io("http://192.168.0.111:5000", {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("join_room", "general");
    });

    // Обновляем обработчик получения сообщений
    socket.on("receive_message", (newMessage) => {
      console.log("Received new message:", newMessage);
      // Проверяем, есть ли это сообщение уже в списке
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) => msg._id === newMessage._id
        );
        if (!messageExists) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    setError("");
    try {
      const message = await sendMessage(newMessage);
      // отправленное сообщение приходит через ws
      setNewMessage("");
    } catch (error) {
      setError("Ошибка при отправке сообщения");
      console.error("Ошибка при отправке сообщения:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Чат</h1>
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
            className={`flex ${
              message.sender._id === user.id ? "justify-end" : "justify-start"
            }`}>
            <div
              className={`flex items-start ${
                message.sender._id === user.id ? "flex-row-reverse" : "flex-row"
              } gap-2 max-w-[85%]`}>
              <img
                src={
                  message.sender.avatar
                    ? `http://192.168.0.111:5000${message.sender.avatar}`
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
                    message.sender._id === user.id ? "text-right" : "text-left"
                  }`}>
                  {message.sender._id === user.id
                    ? "Вы"
                    : message.sender.username || message.sender.email}
                </div>
                <p
                  className={`text-sm break-words ${
                    message.sender._id === user.id ? "text-right" : "text-left"
                  }`}>
                  {message.content}
                </p>
                <span
                  className={`text-xs opacity-75 block ${
                    message.sender._id === user.id ? "text-right" : "text-left"
                  }`}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
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
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}>
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
