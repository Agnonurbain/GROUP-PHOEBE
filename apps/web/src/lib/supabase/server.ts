import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@group-phoebe/database/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll peut échouer dans un Server Component (read-only).
            // C'est attendu — le middleware se charge du refresh.
          }
        },
      },
    }
  );
}
