export const queryKeys = {
  chats: {
    all: ["chats"],
  },
  profile: {
    byId: (id) => ["profile", id],
  },
  messages: {
    list: (receiverId) => ["messages", receiverId || "general"],
  },
  status: {
    byUser: (id) => ["status", id],
  },
};

export default queryKeys;
