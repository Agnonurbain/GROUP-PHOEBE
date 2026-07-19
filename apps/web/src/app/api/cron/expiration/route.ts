import { NextRequest, NextResponse } from "next/server";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nb = await expirerReservationsAbandonnees();
  return NextResponse.json({ expired: nb });
}
