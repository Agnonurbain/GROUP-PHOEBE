import { NextRequest, NextResponse } from "next/server";
import { expirerDemandesSansReponse } from "@/lib/payments/expiration-demandes";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nb = await expirerDemandesSansReponse();
  return NextResponse.json({ processed: nb });
}