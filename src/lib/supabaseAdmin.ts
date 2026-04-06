import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

/**
 * Server-side Supabase admin client — uses the service role key.
 * Only import this in API routes (never in client components).
 * Lazily initialised so missing env vars only fail at request time.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

/**
 * @deprecated Use getSupabaseAdmin() instead.
 * Kept for backwards-compatibility with files that import `supabaseAdmin` directly.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
