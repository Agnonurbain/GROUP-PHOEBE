import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let ok = true;

  checks["timestamp"] = new Date().toISOString();

  try {
    const admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await admin.from("vehicules").select("id").limit(1);
    checks["database"] = error ? `error: ${error.message}` : "ok";
  } catch (e) {
    checks["database"] = `error: ${(e as Error).message}`;
    ok = false;
  }

  checks["status"] = ok ? "healthy" : "unhealthy";
  return NextResponse.json(checks, { status: ok ? 200 : 503 });
}
