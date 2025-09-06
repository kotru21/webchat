import { useEffect, useRef } from "react";
import io from "socket.io-client";
import { SOCKET_EVENTS } from "@constants/socketEvents";
import { useMessagesStore } from "@features/messaging/store/messagesStore";
import { usePresenceStore } from "@shared/store/presenceStore";

const useChatSocket = ({
  user,
  selectedUser,
  incrementUnread,
  onSocketSendRef,
}) => {
  const setAllPresence = usePresenceStore((s) => s.setAll);
  const updatePresenceStatus = usePresenceStore((s) => s.updateStatus);
  const addMessage = useMessagesStore((s) => s.addMessage);
  const updateMessage = useMessagesStore((s) => s.updateMessage);
  const removeMessage = useMessagesStore((s) => s.removeMessage);
  const markRead = useMessagesStore((s) => s.markRead);
  const pinMessage = useMessagesStore((s) => s.pinMessage);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const joinRooms = () => {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, "general");
      if (selectedUser?.id)
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, selectedUser.id);
    };

    socket.on("connect", joinRooms);
    socket.on("reconnect", joinRooms);
    socket.on("reconnect_error", () => {
      // можно добавить notify при желании
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // требуется ручное подключение
        socket.connect();
      }
    });

    socket.emit(SOCKET_EVENTS.USER_CONNECTED, {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => {
      const isPrivate = !!msg.isPrivate || !!msg.receiver;
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = (msg.receiver && msg.receiver._id) || msg.receiver;
      const currentSelectedId = selectedUser?.id;
      const isOwn = senderId === user.id;

      if (isPrivate) {
        const isCurrentChat =
          currentSelectedId &&
          (senderId === currentSelectedId || receiverId === currentSelectedId);
        if (isCurrentChat) {
          addMessage(selectedUser?.id, msg);
        } else if (!isOwn) {
          const otherId = senderId !== user.id ? senderId : receiverId;
          if (otherId) incrementUnread(otherId);
        }
      } else {
        if (!selectedUser) addMessage(null, msg);
        else if (!isOwn) {
          incrementUnread("general");
        }
      }
    });

    socket.on(SOCKET_EVENTS.USERS_ONLINE, (users) => setAllPresence(users));
    socket.on(SOCKET_EVENTS.MESSAGE_READ, ({ messageId, readBy }) =>
      markRead(messageId, readBy)
    );
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (updatedMessage) =>
      updateMessage(updatedMessage._id, updatedMessage)
    );
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, (messageId) =>
      removeMessage(messageId)
    );
    socket.on(SOCKET_EVENTS.MESSAGE_PINNED, ({ messageId, isPinned }) =>
      pinMessage(messageId, isPinned)
    );
    socket.on(SOCKET_EVENTS.USER_STATUS_CHANGED, ({ userId, status }) => {
      if (userId !== user.id) updatePresenceStatus(userId, status);
    });

    if (onSocketSendRef) {
      onSocketSendRef.current = (payload, cb) => {
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
    incrementUnread,
    addMessage,
    markRead,
    removeMessage,
    updateMessage,
    pinMessage,
    onSocketSendRef,
    setAllPresence,
    updatePresenceStatus,
  ]);

  const prevSelectedRef = useRef(null);
  useEffect(() => {
    if (!socketRef.current) return;
    if (selectedUser?.id && prevSelectedRef.current !== selectedUser.id) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, selectedUser.id);
      prevSelectedRef.current = selectedUser.id;
    }
  }, [selectedUser?.id]);

  return {};
};

export default useChatSocket;
