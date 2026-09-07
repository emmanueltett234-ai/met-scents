"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SelectionItem } from "@/types";

interface SelectionState {
  items: SelectionItem[];
  add: (item: SelectionItem) => void;
  remove: (variantId: string) => void;
  has: (variantId: string) => boolean;
  clear: () => void;
  total: () => number;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.variantId === item.variantId)) return state;
          return { items: [...state.items, item] };
        }),
      remove: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      has: (variantId) => get().items.some((i) => i.variantId === variantId),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price, 0),
    }),
    {
      name: "met-scents-selection",
      version: 1,
    }
  )
);
