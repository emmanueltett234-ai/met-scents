import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Defense-in-depth check for admin API routes. middleware.ts already blocks
 * unauthenticated requests to /admin/*, and RLS blocks unauthenticated
 * writes at the database level — this is a third, explicit check inside the
 * route handler itself so a misconfigured middleware matcher can never be
 * the only thing standing between a request and a write.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, response: null };
}
