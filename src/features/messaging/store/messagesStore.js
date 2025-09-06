import { create } from "zustand";
import {
  mapMessagesArray,
  mapMessageDto,
} from "../../messaging/mappers/messageMapper";

// key вычисляется: null -> 'general', иначе userId
function chatKey(selectedUserId) {
  return selectedUserId ? `private:${selectedUserId}` : "general";
}

export const useMessagesStore = create((set, get) => ({
  chats: {}, // { [chatKey]: { messages: [], loaded: boolean } }
  pending: {}, // { tempId: { key } }
  chatViews: {}, // { [chatKey]: { scrollTop, anchorId, atBottom, ts } }

  setChatMessages: (selectedUserId, list) =>
    set((state) => {
      const key = chatKey(selectedUserId);
      return {
        chats: {
          ...state.chats,
          [key]: { messages: mapMessagesArray(list), loaded: true },
        },
      };
    }),

  addMessage: (selectedUserId, dto) =>
    set((state) => {
      const key = chatKey(selectedUserId);
      const chat = state.chats[key] || { messages: [], loaded: true };
      const incoming = mapMessageDto(dto);
      // дедупликация по _id (или id как fallback)
      const id = incoming._id || incoming.id;
      const exists = chat.messages.some((m) => (m._id || m.id) === id);
      if (exists) {
        return { chats: state.chats }; // без изменений
      }
      return {
        chats: {
          ...state.chats,
          [key]: { ...chat, messages: [...chat.messages, incoming] },
        },
      };
    }),

  addPendingMessage: (selectedUserId, tempMessage) =>
    set((state) => {
      const key = chatKey(selectedUserId);
      const chat = state.chats[key] || { messages: [], loaded: true };
      return {
        chats: {
          ...state.chats,
          [key]: {
            ...chat,
            messages: [...chat.messages, { ...tempMessage, optimistic: true }],
          },
        },
        pending: { ...state.pending, [tempMessage._id]: { key } },
      };
    }),

  finalizePendingMessage: (tempId, realDto) =>
    set((state) => {
      const meta = state.pending[tempId];
      if (!meta) return state;
      const { key } = meta;
      const chat = state.chats[key];
      if (!chat) return state;
      const real = mapMessageDto(realDto);
      // Если сообщение с реальным _id уже существует (пришло сокетом раньше) — просто удаляем temp
      const alreadyIndex = chat.messages.findIndex(
        (m) => m._id === real._id && m._id !== tempId
      );
      let newMessages;
      if (alreadyIndex !== -1) {
        newMessages = chat.messages.filter((m) => m._id !== tempId);
      } else {
        newMessages = chat.messages.map((m) => (m._id === tempId ? real : m));
      }
      return {
        chats: {
          ...state.chats,
          [key]: {
            ...chat,
            messages: newMessages,
          },
        },
        pending: Object.fromEntries(
          Object.entries(state.pending).filter(([k]) => k !== tempId)
        ),
      };
    }),

  failPendingMessage: (tempId) =>
    set((state) => {
      const meta = state.pending[tempId];
      if (!meta) return state;
      const { key } = meta;
      const chat = state.chats[key];
      if (!chat) return state;
      return {
        chats: {
          ...state.chats,
          [key]: {
            ...chat,
            messages: chat.messages.map((m) =>
              m._id === tempId ? { ...m, failed: true, optimistic: false } : m
            ),
          },
        },
        pending: Object.fromEntries(
          Object.entries(state.pending).filter(([k]) => k !== tempId)
        ),
      };
    }),

  updateMessage: (messageId, dto) =>
    set((state) => {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((k) => {
        chats[k] = {
          ...chats[k],
          messages: chats[k].messages.map((m) =>
            m._id === messageId ? mapMessageDto(dto) : m
          ),
        };
      });
      return { chats };
    }),

  removeMessage: (messageId) =>
    set((state) => {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((k) => {
        chats[k] = {
          ...chats[k],
          messages: chats[k].messages.filter((m) => m._id !== messageId),
        };
      });
      return { chats };
    }),

  // Soft delete: помечаем сообщение как удалённое, не выкидывая из списка (для текущего UX)
  markMessageDeleted: (messageId) =>
    set((state) => {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((k) => {
        chats[k] = {
          ...chats[k],
          messages: chats[k].messages.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, content: m.content }
              : m
          ),
        };
      });
      return { chats };
    }),

  markRead: (messageId, readBy) =>
    set((state) => {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((k) => {
        chats[k] = {
          ...chats[k],
          messages: chats[k].messages.map((m) =>
            m._id === messageId ? { ...m, readBy } : m
          ),
        };
      });
      return { chats };
    }),

  pinMessage: (messageId, isPinned) =>
    set((state) => {
      const chats = { ...state.chats };
      Object.keys(chats).forEach((k) => {
        chats[k] = {
          ...chats[k],
          messages: chats[k].messages.map((m) =>
            m._id === messageId ? { ...m, isPinned } : m
          ),
        };
      });
      return { chats };
    }),

  getMessages: (selectedUserId) => {
    const key = chatKey(selectedUserId);
    return get().chats[key]?.messages || [];
  },

  saveChatView: (selectedUserId, view) =>
    set((state) => {
      const key = chatKey(selectedUserId);
      return {
        chatViews: {
          ...state.chatViews,
          [key]: { ...view, ts: Date.now() },
        },
      };
    }),

  getChatView: (selectedUserId) => {
    const key = chatKey(selectedUserId);
    return get().chatViews[key];
  },
}));

export function getChatKey(id) {
  return chatKey(id);
}
