import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

let systemThemeListenerBound = false;

export const useUIStore = create(
  devtools(
    persist(
      (set, get) => ({
        isSidebarOpen: false,
        fullscreenMedia: null,
        isProfileEditorOpen: false,
        theme: "system",
        setSidebarOpen: (v) => set({ isSidebarOpen: v }),
        toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
        openMedia: (media) => set({ fullscreenMedia: media }),
        closeMedia: () => set({ fullscreenMedia: null }),
        openProfileEditor: () => set({ isProfileEditorOpen: true }),
        closeProfileEditor: () => set({ isProfileEditorOpen: false }),
        setTheme: (t) => {
          set({ theme: t });
          applyTheme(t);
        },
        detectSystemTheme: () => systemTheme(),
        applyCurrentTheme: () => {
          applyTheme(get().theme);
        },
      }),
      {
        name: "ui-store",
        partialize: (s) => ({ theme: s.theme }),
        onRehydrateStorage: () => (state) => {
          if (state?.theme) applyTheme(state.theme);
          bindSystemThemeListener();
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

function bindSystemThemeListener() {
  if (systemThemeListenerBound || typeof window === "undefined") return;
  systemThemeListenerBound = true;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    const { theme, applyCurrentTheme } = useUIStore.getState();
    if (theme === "system") applyCurrentTheme();
  };
  mq.addEventListener("change", onChange);
}

export function initTheme() {
  const stored = (() => {
    try {
      const raw = localStorage.getItem("ui-store");
      if (!raw) return "system";
      const parsed = JSON.parse(raw);
      return parsed?.state?.theme || "system";
    } catch {
      return "system";
    }
  })();
  applyTheme(stored);
  bindSystemThemeListener();
}
