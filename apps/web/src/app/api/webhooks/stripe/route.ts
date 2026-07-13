import { NextRequest, NextResponse } from "next/server";
import { verifierSignatureStripe } from "@/lib/payments/stripe";
import {
  traiterPaiementConfirme,
  traiterPaiementEchoue,
} from "@/lib/payments/traitement";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event;
  try {
    event = verifierSignatureStripe(body, signature);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const session = event.data.object as {
    metadata?: { paiement_id?: string };
    payment_intent?: string;
  };
  const paiementId = session.metadata?.paiement_id;

  if (!paiementId) {
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    await traiterPaiementConfirme(
      paiementId,
      typeof session.payment_intent === "string" ? session.payment_intent : undefined
    );
  } else if (event.type === "checkout.session.expired") {
    await traiterPaiementEchoue(paiementId);
  }

  return NextResponse.json({ received: true });
}
