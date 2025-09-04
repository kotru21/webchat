// Socket events (frontend mirror of server shared events)
export const SOCKET_EVENTS = Object.freeze({
  USER_CONNECTED: "user_connected",
  USERS_ONLINE: "users_online",
  USER_STATUS_CHANGED: "user_status_changed",
  JOIN_ROOM: "join_room",
  MESSAGE_SEND: "message_send",
  MESSAGE_NEW: "message_new",
  MESSAGE_READ: "message_read",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETE: "message_delete",
  MESSAGE_PINNED: "message_pinned",
});

export default SOCKET_EVENTS;
