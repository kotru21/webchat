export const queryKeys = {
  chats: {
    all: ["chats"],
  },
  users: {
    search: (q) => ["users", "search", q],
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
