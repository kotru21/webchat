import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
} from "../services/api";

const useChatMessages = (selectedUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Fetch messages when selected user changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getMessages(selectedUser?.id);

        // Mark messages as read locally
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

        // Send read confirmations to server
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

  // Send message handler
  const sendMessageHandler = async (formData) => {
    setLoading(true);
    try {
      if (selectedUser) formData.append("receiverId", selectedUser.id);
      await sendMessage(formData);
      return true;
    } catch (error) {
      setError("Ошибка при отправке сообщения");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark message as read handler
  const markAsReadHandler = async (message) => {
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
      } catch (error) {
        console.error("Ошибка при отметке сообщения:", error);
      }
    }
  };

  // Edit message handler
  const editMessageHandler = async (messageId, formData) => {
    try {
      await updateMessage(messageId, formData);
      // Socket will handle the update in the messages list
    } catch (error) {
      setError("Ошибка при редактировании сообщения");
    }
  };

  // Delete message handler
  const deleteMessageHandler = async (messageId) => {
    try {
      await deleteMessage(messageId);
      // Socket will handle the removal from the messages list
    } catch (error) {
      setError("Ошибка при удалении сообщения");
    }
  };

  return {
    messages,
    loading,
    error,
    setError,
    setMessages,
    sendMessageHandler,
    markAsReadHandler,
    editMessageHandler,
    deleteMessageHandler,
  };
};

export default useChatMessages;
