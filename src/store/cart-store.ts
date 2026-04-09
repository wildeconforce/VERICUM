"use client";

import { create } from "zustand";

interface CartItem {
  contentId: string;
  title: string;
  price: number;
  currency: string;
  licenseType: string;
  thumbnailUrl: string;
  sellerName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (contentId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      if (state.items.find((i) => i.contentId === item.contentId)) return state;
      return { items: [...state.items, item] };
    }),
  removeItem: (contentId) =>
    set((state) => ({
      items: state.items.filter((i) => i.contentId !== contentId),
    })),
  clearCart: () => set({ items: [] }),
  getTotal: () => get().items.reduce((sum, item) => sum + item.price, 0),
}));
