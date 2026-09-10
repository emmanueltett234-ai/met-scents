import { z } from "zod";

const uuid = z.string().uuid();

// Accepts Ghanaian numbers in common formats: 024 123 4567, +233241234567, etc.
const whatsappRegex = /^[+]?[\d\s-]{9,16}$/;

export const enquiryItemSchema = z.object({
  product_id: uuid,
  variant_id: uuid,
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
});

export const enquirySubmissionSchema = z.object({
  customer_name: z.string().trim().min(2, "Please enter your full name").max(120),
  whatsapp_number: z
    .string()
    .trim()
    .regex(whatsappRegex, "Please enter a valid WhatsApp number"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  location: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  message: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  items: z.array(enquiryItemSchema).min(1, "Select at least one fragrance before submitting"),
  // True only when the client already opened wa.me for this submission (the
  // "Send via WhatsApp" button on My Selection). This means WhatsApp OPENED
  // on the customer's device — never that a message was actually sent, since
  // the customer still has to press Send themselves inside WhatsApp.
  whatsapp_opened: z.boolean().optional().default(false),
  // honeypot field — real users never fill this in
  website: z.string().max(0).optional().or(z.literal("")),
});

export type EnquirySubmissionInput = z.infer<typeof enquirySubmissionSchema>;

// ----------------------------------------------------------------------------
// Admin: products & variants
// ----------------------------------------------------------------------------
const genderEnum = z.enum(["men", "women", "unisex"]);
const availabilityEnum = z.enum(["available", "low_stock", "out_of_stock", "coming_soon"]);

export const productVariantInputSchema = z.object({
  id: uuid.optional(),
  size: z.string().trim().min(1, "Size is required").max(60),
  price: z.coerce.number().min(0, "Price must be zero or more"),
  availability: availabilityEnum.default("available"),
});

export const productInputSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(100),
  name: z.string().trim().min(1, "Name is required").max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fragrance_notes: z.string().trim().max(500).optional().or(z.literal("")),
  fragrance_type: z.string().trim().max(80).optional().or(z.literal("")),
  gender: genderEnum,
  product_type_id: uuid,
  image_url: z.string().trim().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  new_arrival: z.boolean().default(false),
  best_seller: z.boolean().default(false),
  availability: availabilityEnum.default("available"),
  variants: z.array(productVariantInputSchema).min(1, "Add at least one size/price"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const productTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "pending", "completed", "cancelled"]),
});

// ----------------------------------------------------------------------------
// Admin: enquiry outcome, notes, activities
// ----------------------------------------------------------------------------
export const enquiryOutcomeSchema = z.object({
  outcome: z.enum(["no_decision", "contacted", "sale_completed", "no_sale", "cancelled"]),
});

export const enquiryNoteInputSchema = z.object({
  note: z.string().trim().min(1, "Note can't be empty").max(2000),
});

// ----------------------------------------------------------------------------
// Admin: sales & sale items
// ----------------------------------------------------------------------------
const saleSourceEnum = z.enum(["website", "whatsapp", "instagram", "walk_in", "referral", "other"]);
const paymentMethodEnum = z.enum(["cash", "mobile_money", "bank_transfer", "other"]);

export const saleItemInputSchema = z.object({
  id: uuid.optional(),
  product_id: uuid.nullable().optional(),
  product_name_snapshot: z.string().trim().min(1, "Product name is required").max(200),
  brand_snapshot: z.string().trim().max(100).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  size_snapshot: z.string().trim().min(1, "Size is required").max(60),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
  unit_price: z.coerce.number().min(0, "Unit price must be zero or more"),
});

export const saleInputSchema = z.object({
  enquiry_id: uuid.nullable().optional(),
  customer_name: z.string().trim().min(1, "Customer name is required").max(120),
  whatsapp_number: z.string().trim().max(30).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  sale_date: z.coerce.date().optional(),
  source: saleSourceEnum,
  payment_method: paymentMethodEnum,
  sale_amount: z.coerce.number().min(0, "Sale amount must be zero or more"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  items: z.array(saleItemInputSchema).optional().default([]),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

export const settingsInputSchema = z.object({
  owner_whatsapp_number: z
    .string()
    .trim()
    .regex(whatsappRegex, "Please enter a valid WhatsApp number")
    .optional()
    .or(z.literal("")),
  owner_notification_email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  // Kept for backward compatibility with the existing `settings` row — no
  // longer surfaced in the admin UI since WhatsApp has no server-side
  // integration to toggle. Always defaults to true if omitted.
  whatsapp_notifications_enabled: z.boolean().optional().default(true),
  email_notifications_enabled: z.boolean(),
});
