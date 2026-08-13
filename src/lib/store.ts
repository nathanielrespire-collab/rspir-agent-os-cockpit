import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/lib/i18n";

export type Role = "Nathaniel" | "Manny" | "Antoine" | "Agent";
export type Theme = "dark" | "light";

interface UIStore {
  lang: Lang;
  theme: Theme;
  role: Role;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setRole: (role: Role) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      lang: "fr",
      theme: "dark",
      role: "Nathaniel",
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setRole: (role) => set({ role }),
    }),
    {
      name: "rspir-ui",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
