import { NextRequest, NextResponse } from "next/server";
import {
  verifierSignatureCinetPay,
  verifierTransactionCinetPay,
} from "@/lib/payments/cinetpay";
import {
  traiterPaiementConfirme,
  traiterPaiementEchoue,
} from "@/lib/payments/traitement";
import { estDejaTraite, marquerTraite } from "@/lib/payments/webhook-utils";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-cinetpay-signature") ?? "";
  const idempotencyKey = request.headers.get("x-cinetpay-idempotency-key")
    ?? request.headers.get("x-idempotency-key")
    ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 401 });
  }

  if (!process.env.CINETPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret non configuré" }, { status: 500 });
  }

  const valid = verifierSignatureCinetPay(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
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

  // Idempotence
  const key = idempotencyKey || `cinetpay-${paiementId}`;
  if (await estDejaTraite(key)) {
    return NextResponse.json({ received: true, already: true });
  }

  const check = await verifierTransactionCinetPay(paiementId);

  if (check.status === "ACCEPTED") {
    await traiterPaiementConfirme(paiementId);
  } else if (check.status === "REFUSED") {
    await traiterPaiementEchoue(paiementId);
  }

  await marquerTraite(key);
  return NextResponse.json({ received: true });
}
