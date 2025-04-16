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

    // Connect and join rooms
    socket.on("connect", () => {
      socket.emit("join_room", "general");
      socket.emit("user_connected", {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      });
    });

    // Handle general messages
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

    // Handle private messages
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

    // Handle online users
    socket.on("users_online", (users) => {
      setOnlineUsers(users);
    });

    // Handle message updates
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

    // Handle user status changes
    socket.on("userStatusChanged", (data) => {
      const { userId, status } = data;

      // If it's not the current user, update their status in the contact list
      if (userId !== user.id) {
        // Update status in the user/contact list
        setOnlineUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? { ...user, status } : user
          )
        );

        // Update status in current chats
        setMessages((prevChats) =>
          prevChats.map((chat) => {
            // For private chats
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
