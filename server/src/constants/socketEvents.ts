export const SOCKET_EVENTS = Object.freeze({
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  USER_CONNECTED: "user_connected",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  MESSAGE_SEND: "message_send",
  MESSAGE_SEND_MEDIA: "message_send_media",
  MESSAGE_NEW: "message_new",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETE: "message_delete",
  MESSAGE_PINNED: "message_pinned",
  MESSAGE_READ: "message_read",
});

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
