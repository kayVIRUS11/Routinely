import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Browser-side Supabase client — uses the public anon key.
 * Safe to import in client components and hooks.
 * Do NOT use this in API routes; use the service-role client instead.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
