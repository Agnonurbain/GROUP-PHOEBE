import { NextRequest, NextResponse } from "next/server";
import {
  verifierSignatureCinetPay,
  verifierTransactionCinetPay,
} from "@/lib/payments/cinetpay";
import {
  traiterPaiementConfirme,
  traiterPaiementEchoue,
} from "@/lib/payments/traitement";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-cinetpay-signature") ?? "";

  if (process.env.CINETPAY_WEBHOOK_SECRET && signature) {
    const valid = verifierSignatureCinetPay(body, signature);
    if (!valid) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 400 }
      );
    }
  }

  let parsed: { cpm_trans_id?: string };
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const paiementId = parsed.cpm_trans_id;
  if (!paiementId) {
    return NextResponse.json({ received: true });
  }

  const check = await verifierTransactionCinetPay(paiementId);

  if (check.status === "ACCEPTED") {
    await traiterPaiementConfirme(paiementId);
  } else if (check.status === "REFUSED") {
    await traiterPaiementEchoue(paiementId);
  }

  return NextResponse.json({ received: true });
}
