export const SOCKET_EVENTS = Object.freeze({
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  USER_CONNECTED: "user_connected",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  MESSAGE_SEND: "message_send",
  MESSAGE_NEW: "message_new",
});

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
