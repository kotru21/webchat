import { create } from "zustand";

let idCounter = 0;

export const useNotificationsStore = create((set) => ({
  toasts: [], // { id, message, type, ttl, createdAt, actions?: [{label,onClick}] }
  limit: 5,
  push: (toast) =>
    set((state) => {
      const id = ++idCounter;
      const next = [
        ...state.toasts,
        { id, type: "info", ttl: 5000, createdAt: Date.now(), ...toast },
      ];
      const overflow = next.length - state.limit;
      return { toasts: overflow > 0 ? next.slice(overflow) : next };
    }),
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
