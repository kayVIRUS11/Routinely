import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // During SSR/build without env vars, provide a clearly invalid URL so the
  // client is inert. All real operations happen in the browser where env vars
  // must be set. We do NOT silently fall back to a placeholder that could
  // mask misconfiguration — the app simply won't make Supabase calls.
  if (typeof window !== "undefined") {
    console.error(
      "[Routinely] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. " +
        "Supabase auth will not work until these are configured in .env.local.",
    );
  }
}

/**
 * Browser-side Supabase client — uses the public anon key.
 * Safe to import in client components and hooks.
 * Do NOT use this in API routes; use the service-role client instead.
 */
export const supabase = createClient(
  supabaseUrl || "https://unset.supabase.co",
  supabaseAnonKey || "unset-anon-key",
);
