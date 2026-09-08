export type Gender = "men" | "women" | "unisex";

export type Availability = "available" | "low_stock" | "out_of_stock" | "coming_soon";

export type EnquiryStatus = "new" | "contacted" | "pending" | "completed" | "cancelled";

export type NotificationStatus = "not_configured" | "sent" | "failed";

export type EnquirySource = "website" | "whatsapp" | "unknown";

export type EnquiryOutcome = "no_decision" | "contacted" | "sale_completed" | "no_sale" | "cancelled";

export type SaleSource = "website" | "whatsapp" | "instagram" | "walk_in" | "referral" | "other";

export type PaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "other";

export type ActivityEventType =
  | "enquiry_created"
  | "whatsapp_opened"
  | "status_changed"
  | "outcome_changed"
  | "note_added"
  | "sale_created"
  | "sale_updated";

export interface StoreSettings {
  id: string;
  owner_whatsapp_number: string | null;
  owner_notification_email: string | null;
  whatsapp_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  price: number;
  availability: Availability;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  slug: string;
  description: string | null;
  fragrance_notes: string | null;
  fragrance_type: string | null;
  gender: Gender;
  category: string;
  image_url: string | null;
  featured: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  availability: Availability;
  created_at: string;
  updated_at: string;
  product_variants?: ProductVariant[];
}

export interface EnquiryItemInput {
  product_id: string;
  variant_id: string;
}

export interface EnquiryItem {
  id: string;
  enquiry_id: string;
  product_id: string | null;
  product_name: string;
  brand: string | null;
  size: string;
  price: number;
  quantity: number;
}

export interface Enquiry {
  id: string;
  customer_name: string;
  whatsapp_number: string;
  email: string | null;
  location: string | null;
  message: string | null;
  estimated_total: number;
  status: EnquiryStatus;
  whatsapp_status: NotificationStatus;
  whatsapp_error: string | null;
  email_status: NotificationStatus;
  email_error: string | null;
  enquiry_source: EnquirySource;
  whatsapp_opened: boolean;
  whatsapp_opened_at: string | null;
  outcome: EnquiryOutcome;
  contacted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  enquiry_items?: EnquiryItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  brand_snapshot: string | null;
  size_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Sale {
  id: string;
  enquiry_id: string | null;
  customer_name: string;
  whatsapp_number: string | null;
  sale_date: string;
  source: SaleSource;
  payment_method: PaymentMethod;
  sale_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sale_items?: SaleItem[];
}

export interface EnquiryActivity {
  id: string;
  enquiry_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  created_at: string;
  created_by: string | null;
}

export interface EnquiryNote {
  id: string;
  enquiry_id: string;
  note: string;
  created_at: string;
  created_by: string | null;
}

// Client-side "My Selection" line item (before submission)
export interface SelectionItem {
  productId: string;
  variantId: string;
  slug: string;
  brand: string;
  name: string;
  size: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export const GENDER_LABELS: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Available",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  coming_soon: "Coming Soon",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ENQUIRY_SOURCE_LABELS: Record<EnquirySource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  unknown: "Unknown",
};

export const ENQUIRY_OUTCOME_LABELS: Record<EnquiryOutcome, string> = {
  no_decision: "No Decision Yet",
  contacted: "Contacted",
  sale_completed: "Sale Completed",
  no_sale: "No Sale",
  cancelled: "Cancelled",
};

export const SALE_SOURCE_LABELS: Record<SaleSource, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  other: "Other",
};
