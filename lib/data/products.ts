import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

export interface ProductFilters {
  search?: string;
  brand?: string;
  gender?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "popularity";
  view?: "decants" | "full-bottles" | "new-arrivals" | "best-sellers";
}

const PRODUCT_SELECT = "*, product_variants(*)";

function minVariantPrice(product: Product): number {
  if (!product.product_variants || product.product_variants.length === 0) return 0;
  return Math.min(...product.product_variants.map((v) => v.price));
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createClient();
  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (filters.brand) query = query.ilike("brand", filters.brand);
  if (filters.gender) query = query.eq("gender", filters.gender);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.view === "new-arrivals") query = query.eq("new_arrival", true);
  if (filters.view === "best-sellers") query = query.eq("best_seller", true);

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`brand.ilike.%${term}%,name.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getProducts error:", error.message);
    return [];
  }

  let products = (data ?? []) as Product[];

  // Decants / full bottles are a size-level concept, not a product column —
  // filter on whether any variant's size text matches.
  if (filters.view === "decants") {
    products = products.filter((p) =>
      p.product_variants?.some((v) => /decant|ml/i.test(v.size) && !/bottle/i.test(v.size))
    );
  }
  if (filters.view === "full-bottles") {
    products = products.filter((p) => p.product_variants?.some((v) => /bottle/i.test(v.size)));
  }

  if (filters.minPrice !== undefined) {
    products = products.filter((p) => minVariantPrice(p) >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    products = products.filter((p) => minVariantPrice(p) <= filters.maxPrice!);
  }

  switch (filters.sort) {
    case "price-asc":
      products.sort((a, b) => minVariantPrice(a) - minVariantPrice(b));
      break;
    case "price-desc":
      products.sort((a, b) => minVariantPrice(b) - minVariantPrice(a));
      break;
    case "popularity":
      products.sort((a, b) => {
        const score = (p: Product) => (p.best_seller ? 2 : 0) + (p.featured ? 1 : 0);
        return score(b) - score(a) || +new Date(b.created_at) - +new Date(a.created_at);
      });
      break;
    case "newest":
    default:
      products.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      break;
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getProductBySlug error:", error.message);
    return null;
  }
  return data as Product | null;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("featured", true)
    .limit(limit);

  if (error) {
    console.error("getFeaturedProducts error:", error.message);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function getAllBrands(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("products").select("brand");
  if (error || !data) return [];
  return Array.from(new Set(data.map((d) => d.brand))).sort();
}
