import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

// Client anon sans cookies : requis dans les fonctions unstable_cache,
// où les APIs dynamiques comme cookies() sont interdites.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
