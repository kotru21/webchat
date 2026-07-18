// Socket events (frontend mirror of server shared events)
export const SOCKET_EVENTS = Object.freeze({
  USER_CONNECTED: "user_connected",
  JOIN_ROOM: "join_room",
  MESSAGE_SEND: "message_send",
  MESSAGE_NEW: "message_new",
});

export default SOCKET_EVENTS;
