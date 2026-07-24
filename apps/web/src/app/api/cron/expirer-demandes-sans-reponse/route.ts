import { NextRequest, NextResponse } from "next/server";
import { expirerDemandesSansReponse } from "@/lib/payments/expiration-demandes";

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

  const nb = await expirerDemandesSansReponse();
  return NextResponse.json({ processed: nb });
}