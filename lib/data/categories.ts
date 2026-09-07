import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) {
    console.error("getCategories error:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}
