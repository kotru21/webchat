import { useEffect, useRef } from "react";
import io from "socket.io-client";
import { SOCKET_EVENTS } from "@constants/socketEvents";
import { useMessagesStore } from "@shared/store/messagesStore";
import { notify } from "@shared/event/notify";
import { getApiBaseUrl } from "@shared/lib/apiUrl";
import { clearAccessToken, getAccessToken, setAccessToken } from "@shared/lib/accessToken";
import {
  clearRefreshSessionFlag,
  refreshAccessToken,
} from "@shared/lib/refreshSession";
import { resolvePeerId } from "@shared/lib/peerId";

const MAX_RECONNECTION_ATTEMPTS = 15;

const dmRoomId = (userA, userB) => {
  const [minId, maxId] = [userA, userB].sort();
  return `dm:${minId}:${maxId}`;
};

const forceLogin = () => {
  clearAccessToken();
  clearRefreshSessionFlag();
  notify("error", "Ошибка авторизации. Пожалуйста, войдите снова.");
  window.location.href = "/login";
};

const useChatSocket = ({
  user,
  selectedUser,
  incrementUnread,
  onSocketSendRef,
}) => {
  const addMessage = useMessagesStore((s) => s.addMessage);
  const socketRef = useRef(null);
  const peerId = resolvePeerId(selectedUser);

  useEffect(() => {
    if (!user) return;

    const token = getAccessToken();
    if (!token) {
      console.warn("[Socket] No auth token found, skipping connection");
      return;
    }

    const socketBaseUrl = getApiBaseUrl();
    const socketOptions = {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      auth: { token },
    };

    const socket = socketBaseUrl
      ? io(socketBaseUrl, socketOptions)
      : io(socketOptions);
    socketRef.current = socket;

    let refreshInFlight = false;

    const joinRooms = () => {
      socket.emit(SOCKET_EVENTS.USER_CONNECTED);
      if (peerId) {
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, dmRoomId(user.id, peerId));
      }
    };

    socket.on("connect", joinRooms);
    socket.on("reconnect", joinRooms);
    socket.on("reconnect_failed", () => {
      notify("error", "Не удалось восстановить соединение. Обновите страницу.");
    });
    socket.on("connect_error", async (error) => {
      if (
        error.message === "AUTH_REQUIRED" ||
        error.message === "INVALID_TOKEN"
      ) {
        forceLogin();
        return;
      }

      if (error.message !== "TOKEN_EXPIRED") return;
      if (refreshInFlight) return;

      refreshInFlight = true;
      socket.io.opts.reconnection = false;

      try {
        const newToken = await refreshAccessToken();
        setAccessToken(newToken);
        socket.auth = { token: newToken };
        socket.io.opts.reconnection = true;
        socket.connect();
      } catch {
        forceLogin();
      } finally {
        refreshInFlight = false;
      }
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = (msg.receiver && msg.receiver._id) || msg.receiver;
      const currentSelectedId = peerId;
      const isOwn = senderId === user.id;

      if (!msg.isPrivate && !msg.receiver) return;

      const isCurrentChat =
        currentSelectedId &&
        (senderId === currentSelectedId || receiverId === currentSelectedId);
      if (isCurrentChat) {
        addMessage(peerId, msg);
      } else if (!isOwn) {
        const otherId = senderId !== user.id ? senderId : receiverId;
        if (otherId) incrementUnread(otherId);
      }
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
  }, [user, peerId, incrementUnread, addMessage, onSocketSendRef]);

  const prevSelectedRef = useRef(null);
  useEffect(() => {
    if (!socketRef.current || !user?.id) return;
    if (peerId && prevSelectedRef.current !== peerId) {
      socketRef.current.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        dmRoomId(user.id, peerId)
      );
      prevSelectedRef.current = peerId;
    }
  }, [peerId, user?.id]);

  return {};
};

export default useChatSocket;
