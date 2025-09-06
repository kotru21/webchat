import { create } from "zustand";

// Храним онлайн-пользователей и быстрый индекс по id
export const usePresenceStore = create((set, get) => ({
  users: [], // массив { _id, username, avatar, status }
  map: {}, // { [id]: user }
  setAll(users) {
    const map = Object.fromEntries(users.map((u) => [u._id, u]));
    set({ users, map });
  },
  upsert(user) {
    const { map, users } = get();
    const existing = map[user._id];
    if (
      existing &&
      existing.status === user.status &&
      existing.avatar === user.avatar &&
      existing.username === user.username
    )
      return; // нет изменений
    const nextMap = { ...map, [user._id]: { ...existing, ...user } };
    const nextUsers = existing
      ? users.map((u) => (u._id === user._id ? nextMap[user._id] : u))
      : [...users, nextMap[user._id]];
    set({ users: nextUsers, map: nextMap });
  },
  updateStatus(userId, status) {
    const { map, users } = get();
    if (!map[userId] || map[userId].status === status) return;
    const nextMap = { ...map, [userId]: { ...map[userId], status } };
    set({
      map: nextMap,
      users: users.map((u) => (u._id === userId ? nextMap[userId] : u)),
    });
  },
  clear() {
    set({ users: [], map: {} });
  },
}));

// Селекторы
export const selectOnlineUsers = (s) => s.users;
export const makeSelectUserById = (id) => (s) => s.map[id];
export const selectUpdateStatus = (s) => s.updateStatus;
