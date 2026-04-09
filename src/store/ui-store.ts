"use client";

import { create } from "zustand";

interface UIState {
  isMobileNavOpen: boolean;
  isSearchOpen: boolean;
  theme: "light" | "dark";
  setMobileNavOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileNavOpen: false,
  isSearchOpen: false,
  theme: "light",
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
}));
