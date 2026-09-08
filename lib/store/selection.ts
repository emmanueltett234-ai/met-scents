"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SelectionItem } from "@/types";

interface SelectionState {
  items: SelectionItem[];
  add: (item: Omit<SelectionItem, "quantity"> & { quantity?: number }) => void;
  remove: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  has: (variantId: string) => boolean;
  clear: () => void;
  total: () => number;
}

const MAX_QUANTITY = 20;

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.variantId === item.variantId)) return state;
          return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
        }),
      remove: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity))) }
              : i
          ),
        })),
      has: (variantId) => get().items.some((i) => i.variantId === variantId),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "met-scents-selection",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { items?: Array<Record<string, unknown>> };
        return {
          items: (state.items ?? []).map((i) => ({ ...i, quantity: (i.quantity as number) ?? 1 })),
        };
      },
    }
  )
);
