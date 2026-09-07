import { z } from "zod";

const uuid = z.string().uuid();

// Accepts Ghanaian numbers in common formats: 024 123 4567, +233241234567, etc.
const whatsappRegex = /^[+]?[\d\s-]{9,16}$/;

export const enquiryItemSchema = z.object({
  product_id: uuid,
  variant_id: uuid,
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
  category: z.string().trim().min(1, "Category is required"),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  new_arrival: z.boolean().default(false),
  best_seller: z.boolean().default(false),
  availability: availabilityEnum.default("available"),
  variants: z.array(productVariantInputSchema).min(1, "Add at least one size/price"),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "pending", "completed", "cancelled"]),
});
