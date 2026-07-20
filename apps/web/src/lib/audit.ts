"use server";

import { headers } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim()
      || h.get("x-real-ip")
      || null;
  } catch {
    return null;
  }
}

export async function logAudit(params: {
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const admin = getAdmin();
  const ip = params.ipAddress ?? await getClientIp();
  await (admin.from as Function)("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    table_name: params.tableName,
    record_id: params.recordId ?? null,
    old_values: params.oldValues ?? null,
    new_values: params.newValues ?? null,
    ip_address: ip,
  });
}
