import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
