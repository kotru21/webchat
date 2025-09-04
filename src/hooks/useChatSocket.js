import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { useMessagesStore } from "../features/messaging/store/messagesStore";

const useChatSocket = ({
  user,
  selectedUser,
  setUnreadCounts,
  onSocketSendRef,
}) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const addMessage = useMessagesStore((s) => s.addMessage);
  const updateMessage = useMessagesStore((s) => s.updateMessage);
  const removeMessage = useMessagesStore((s) => s.removeMessage);
  const markRead = useMessagesStore((s) => s.markRead);
  const pinMessage = useMessagesStore((s) => s.pinMessage);

  const socketRef = useRef(null);

  // selectedUser обрабатывается отдельным эффектом re-join ниже
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    // соединение и присоединение к комнатам
    socket.on("connect", () => {
      console.debug("[socket] connected", socket.id);
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, "general");
      if (selectedUser?.id) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, selectedUser.id);
      }
    });

    socket.emit(SOCKET_EVENTS.USER_CONNECTED, {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
    });

    // универсальное событие нового сообщения
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => {
      console.debug("[socket] MESSAGE_NEW", msg._id, msg.content?.slice(0, 40));
      const isPrivate = !!msg.isPrivate || !!msg.receiver;
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = (msg.receiver && msg.receiver._id) || msg.receiver;
      const currentSelectedId = selectedUser?.id;
      const isOwn = senderId === user.id;

      // если это наше сообщение и оно уже было оптимистично добавлено -> finalize через addMessage (дедуп пропустит)
      // (финализация в useChatMessages уже заменила temp на реальное; если сокет приходит раньше — просто добавим)

      if (isPrivate) {
        const isCurrentChat =
          currentSelectedId &&
          (senderId === currentSelectedId || receiverId === currentSelectedId);
        if (isCurrentChat) {
          addMessage(selectedUser?.id, msg);
        } else if (!isOwn) {
          const otherId = senderId !== user.id ? senderId : receiverId;
          if (otherId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [otherId]: (prev[otherId] || 0) + 1,
            }));
          }
          window.dispatchEvent(new CustomEvent("chat:refresh"));
        }
      } else {
        if (!selectedUser) {
          addMessage(null, msg);
        } else if (!isOwn) {
          setUnreadCounts((prev) => ({
            ...prev,
            general: (prev.general || 0) + 1,
          }));
        }
      }
    });

    // онлайн
    socket.on(SOCKET_EVENTS.USERS_ONLINE, (users) => {
      setOnlineUsers(users);
    });

    // обновления сообщений
    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ messageId, readBy }) => {
      markRead(messageId, readBy);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (updatedMessage) => {
      updateMessage(updatedMessage._id, updatedMessage);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (messageId) => {
      removeMessage(messageId);
    });

    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, ({ messageId, isPinned }) => {
      pinMessage(messageId, isPinned);
    });

    // статус пользователя
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, (data) => {
      const { userId, status } = data;
      if (userId !== user.id) {
        setOnlineUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, status } : u))
        );
      }
    });

    // предоставить наружу функцию отправки через сокет (оптимистично)
    if (onSocketSendRef) {
      onSocketSendRef.current = (payload, cb) => {
        console.debug("[socket] emit MESSAGE_SEND", payload);
        socket.emit(SOCKET_EVENTS.MESSAGE_SEND, payload, cb);
      };
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    user,
    selectedUser,
    setUnreadCounts,
    addMessage,
    markRead,
    removeMessage,
    updateMessage,
    pinMessage,
    onSocketSendRef,
  ]);

  // re-join приватной комнаты при смене selectedUser без пересоздания сокета
  const prevSelectedRef = useRef(null);
  useEffect(() => {
    if (!socketRef.current) return;
    if (selectedUser?.id && prevSelectedRef.current !== selectedUser.id) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, selectedUser.id);
      prevSelectedRef.current = selectedUser.id;
    }
  }, [selectedUser?.id]);

  return { onlineUsers };
};

export default useChatSocket;
