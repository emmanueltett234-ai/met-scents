"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — safe to use in Client Components.
 * Uses the public anon key only. RLS policies (see supabase/schema.sql)
 * restrict writes to authenticated (admin) sessions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
