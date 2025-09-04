import { useState, useEffect } from "react";
import io from "socket.io-client";

const useChatSocket = ({
  user,
  selectedUser,
  setMessages,
  setUnreadCounts,
}) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    socket.emit("user_connected", {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
    });

    // connect + join
    socket.on("connect", () => {
      socket.emit("join_room", "general");
      socket.emit("user_connected", {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
    });

    // general
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

    // private (только выбранный чат)
    socket.on("receive_private_message", (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender;
      const receiverId =
        (newMessage.receiver && newMessage.receiver._id) || newMessage.receiver;
      const currentSelectedId = selectedUser?.id;

      const isCurrentChat =
        currentSelectedId &&
        (senderId === currentSelectedId || receiverId === currentSelectedId);
      const isOwn = senderId === user.id;

      if (isCurrentChat) {
        setMessages((prev) => [...prev, newMessage]);
      } else if (!isOwn) {
        // инкремент unread
        const otherId = senderId !== user.id ? senderId : receiverId;
        if (otherId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [otherId]: (prev[otherId] || 0) + 1,
          }));
        }
        // refresh список чатов
        window.dispatchEvent(new CustomEvent("chat:refresh"));
      }
    });

    // онлайн
    socket.on("users_online", (users) => {
      setOnlineUsers(users);
    });

    // обновления сообщений
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

    // статус пользователя
    socket.on("userStatusChanged", (data) => {
      const { userId, status } = data;

      // не текущий
      if (userId !== user.id) {
        // статус в списке
        setOnlineUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, status } : user
          )
        );

        // статус в чатах
        setMessages((prevChats) =>
          prevChats.map((chat) => {
            // private
            if (
              chat.type === "private" &&
              chat.participants.some((p) => p._id === userId)
            ) {
              return {
                ...chat,
                participants: chat.participants.map((p) =>
                  p._id === userId ? { ...p, status } : p
                ),
              };
            }
            return chat;
          })
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedUser, user, setMessages, setUnreadCounts]);

  return { onlineUsers };
};

export default useChatSocket;
