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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from as any)("audit_log").insert({
    user_id: params.userId,
    action: params.action,
    cible_table: params.tableName,
    cible_id: params.recordId ?? null,
    details: {
      old: params.oldValues ?? null,
      new: params.newValues ?? null,
      ip: ip,
    },
  });
}
