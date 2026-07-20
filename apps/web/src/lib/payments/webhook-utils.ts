import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function estDejaTraite(idempotencyKey: string): Promise<boolean> {
  const admin = getAdmin();
  const { data } = await admin
    .from("webhook_idempotency")
    .select("idempotency_key")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  return !!data;
}

export async function marquerTraite(idempotencyKey: string): Promise<void> {
  const admin = getAdmin();
  try {
    await admin.from("webhook_idempotency").insert({ idempotency_key: idempotencyKey });
  } catch {
    // concurrent insert — already processed
  }
}
