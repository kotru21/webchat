// Centralized Socket Event Names
// Use these constants everywhere instead of raw strings
export const SOCKET_EVENTS = Object.freeze({
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  // User / presence
  USER_CONNECTED: "user_connected",
  USERS_ONLINE: "users_online",
  USER_STATUS_CHANGED: "user_status_changed",
  // Rooms / chats
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  // Messages (generic)
  MESSAGE_SEND: "message_send",
  MESSAGE_SEND_MEDIA: "message_send_media",
  MESSAGE_NEW: "message_new",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETE: "message_delete",
  MESSAGE_PINNED: "message_pinned",
  MESSAGE_READ: "message_read",
  // Legacy / REST bridging (to migrate away gradually)
  RECEIVE_MESSAGE: "receive_message",
  RECEIVE_PRIVATE_MESSAGE: "receive_private_message",
});

export default SOCKET_EVENTS;
