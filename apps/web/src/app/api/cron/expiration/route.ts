import { NextRequest, NextResponse } from "next/server";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";

export async function GET(request: NextRequest) {
  // Fail closed : sans secret configure, le litteral valait "Bearer undefined",
  // chaine que n'importe qui pouvait envoyer pour declencher l'expiration.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configure" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nb = await expirerReservationsAbandonnees();
  return NextResponse.json({ expired: nb });
}
