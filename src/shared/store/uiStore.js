import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        isSidebarOpen: false,
        fullscreenMedia: null, // { url, type }
        isProfileEditorOpen: false,
        theme: "system", // 'light' | 'dark' | 'system'
        setSidebarOpen: (v) => set({ isSidebarOpen: v }),
        toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
        openMedia: (media) => set({ fullscreenMedia: media }),
        closeMedia: () => set({ fullscreenMedia: null }),
        openProfileEditor: () => set({ isProfileEditorOpen: true }),
        closeProfileEditor: () => set({ isProfileEditorOpen: false }),
        setTheme: (t) => {
          set({ theme: t });
          applyTheme(t, get().theme);
        },
        detectSystemTheme: () => {
          const mq = window.matchMedia("(prefers-color-scheme: dark)");
          return mq.matches ? "dark" : "light";
        },
        applyCurrentTheme: () => {
          const state = get();
          applyTheme(state.theme);
        },
      }),
      {
        name: "ui-store",
        partialize: (s) => ({ theme: s.theme }),
        onRehydrateStorage: () => (state) => {
          if (state?.theme) applyTheme(state.theme);
        },
      }
    )
  )
);

function applyTheme(theme) {
  const root = document.documentElement;
  const effective = theme === "system" ? systemTheme() : theme;
  if (effective === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
