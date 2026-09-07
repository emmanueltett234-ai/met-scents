"use client";

import { create } from "zustand";
import type { NotificationStatus } from "@/types";

/**
 * Holds the just-submitted enquiry in memory only (not persisted) so the
 * "Thank You" page can offer a one-tap WhatsApp send referencing exactly
 * what was submitted — this is the reliable fallback described in the
 * WhatsApp requirements: every enquiry is saved regardless of automated
 * notification status, and the customer always has a way to also push it
 * to WhatsApp themselves in one tap.
 */
interface LastEnquiryState {
  data: {
    customerName: string;
    whatsappNumber: string;
    items: Array<{ product_name: string; brand: string; size: string; price: number }>;
    estimatedTotal: number;
    whatsappStatus: NotificationStatus;
    ownerWhatsappNumber: string | null;
  } | null;
  set: (data: LastEnquiryState["data"]) => void;
  clear: () => void;
}

export const useLastEnquiryStore = create<LastEnquiryState>((set) => ({
  data: null,
  set: (data) => set({ data }),
  clear: () => set({ data: null }),
}));
