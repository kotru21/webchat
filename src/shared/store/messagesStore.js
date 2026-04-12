import { create } from "zustand";
import {
  addMessageMutation,
  addPendingMessageMutation,
  failPendingMessageMutation,
  finalizePendingMessageMutation,
  markMessageDeletedMutation,
  markReadMutation,
  pinMessageMutation,
  removeMessageMutation,
  resolveChatKey,
  saveChatViewMutation,
  setChatMessagesMutation,
  updateMessageMutation,
} from "./messagesStoreMutations";

export const useMessagesStore = create((set, get) => ({
  chats: {},
  pending: {},
  chatViews: {},

  setChatMessages: (selectedUserId, list) =>
    set((state) => setChatMessagesMutation(state, selectedUserId, list)),

  addMessage: (selectedUserId, dto) =>
    set((state) => addMessageMutation(state, selectedUserId, dto)),

  addPendingMessage: (selectedUserId, tempMessage) =>
    set((state) => addPendingMessageMutation(state, selectedUserId, tempMessage)),

  finalizePendingMessage: (tempId, realDto) =>
    set((state) => finalizePendingMessageMutation(state, tempId, realDto)),

  failPendingMessage: (tempId) =>
    set((state) => failPendingMessageMutation(state, tempId)),

  updateMessage: (messageId, dto) =>
    set((state) => updateMessageMutation(state, messageId, dto)),

  removeMessage: (messageId) =>
    set((state) => removeMessageMutation(state, messageId)),

  markMessageDeleted: (messageId) =>
    set((state) => markMessageDeletedMutation(state, messageId)),

  markRead: (messageId, readBy) =>
    set((state) => markReadMutation(state, messageId, readBy)),

  pinMessage: (messageId, isPinned) =>
    set((state) => pinMessageMutation(state, messageId, isPinned)),

  getMessages: (selectedUserId) => {
    const key = resolveChatKey(selectedUserId);
    return get().chats[key]?.messages || [];
  },

  saveChatView: (selectedUserId, view) =>
    set((state) => saveChatViewMutation(state, selectedUserId, view)),

  getChatView: (selectedUserId) => {
    const key = resolveChatKey(selectedUserId);
    return get().chatViews[key];
  },
}));

export function getChatKey(id) {
  return resolveChatKey(id);
}
