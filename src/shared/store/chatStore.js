import { create } from "zustand";
import { persist } from "zustand/middleware";

// Срез состояния чатов/выбранного пользователя
export const useChatStore = create(
  persist(
    (set, get) => ({
      selectedUser: null, // { id, username, avatar, email, status }
      unreadCounts: {}, // { [key:string]: number }
      setSelectedUser: (user) => set({ selectedUser: user }),
      clearSelectedUser: () => set({ selectedUser: null }),
      setUnreadCounts: (map) => set({ unreadCounts: map || {} }),
      incrementUnread: (key) => {
        const prev = get().unreadCounts[key] || 0;
        set({ unreadCounts: { ...get().unreadCounts, [key]: prev + 1 } });
      },
      resetUnread: (key) => {
        const uc = { ...get().unreadCounts };
        if (key in uc) uc[key] = 0;
        set({ unreadCounts: uc });
      },
      resetAllUnread: () => set({ unreadCounts: {} }),
      // GC: синхронизируем ключи unreadCounts со списком валидных (например после refetch чатов)
      syncUnreadKeys: (validKeys) => {
        const current = get().unreadCounts;
        const next = {};
        validKeys.forEach((k) => {
          if (current[k]) next[k] = current[k];
        });
        set({ unreadCounts: next });
      },
    }),
    {
      name: "chat-store", // ключ в localStorage
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState) return { unreadCounts: {} };
        if (version < 2) {
          // В v2 ничего не меняли по структуре, но гарантируем объект
          return { unreadCounts: persistedState.unreadCounts || {} };
        }
        return persistedState;
      },
      partialize: (state) => ({
        // persist только счётчики
        unreadCounts: state.unreadCounts,
      }),
    }
  )
);

// Lightweight selector helpers
export const selectSelectedUser = (s) => s.selectedUser;
export const selectUnreadCounts = (s) => s.unreadCounts;
export const selectUnreadByKey = (key) => (s) => s.unreadCounts[key] || 0;
export const selectTotalUnread = (s) =>
  Object.values(s.unreadCounts).reduce((acc, v) => acc + (v || 0), 0);
export const selectSetSelectedUser = (s) => s.setSelectedUser;
export const selectResetUnread = (s) => s.resetUnread;
export const selectIncrementUnread = (s) => s.incrementUnread;
export const selectSyncUnreadKeys = (s) => s.syncUnreadKeys;
