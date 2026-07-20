import { NextRequest, NextResponse } from "next/server";
import { verifierSignatureStripe } from "@/lib/payments/stripe";
import {
  traiterPaiementConfirme,
  traiterPaiementEchoue,
} from "@/lib/payments/traitement";
import { estDejaTraite, marquerTraite } from "@/lib/payments/webhook-utils";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 401 });
  }

  let event;
  try {
    event = verifierSignatureStripe(body, signature);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const session = event.data.object as {
    metadata?: { paiement_id?: string };
    payment_intent?: string;
  };
  const paiementId = session.metadata?.paiement_id;

  if (!paiementId) {
    return NextResponse.json({ received: true });
  }

  // Idempotence
  const key = `stripe-${event.id}`;
  if (await estDejaTraite(key)) {
    return NextResponse.json({ received: true, already: true });
  }

  if (event.type === "checkout.session.completed") {
    await traiterPaiementConfirme(
      paiementId,
      typeof session.payment_intent === "string" ? session.payment_intent : undefined
    );
  } else if (event.type === "checkout.session.expired") {
    await traiterPaiementEchoue(paiementId);
  }

  await marquerTraite(key);
  return NextResponse.json({ received: true });
}
