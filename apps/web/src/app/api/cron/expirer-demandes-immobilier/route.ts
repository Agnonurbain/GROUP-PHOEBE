import { NextRequest, NextResponse } from "next/server";
import { expirerDemandesImmobilierSansReponse } from "@/lib/payments/expiration-immobilier";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nb = await expirerDemandesImmobilierSansReponse();
  return NextResponse.json({ processed: nb });
}
