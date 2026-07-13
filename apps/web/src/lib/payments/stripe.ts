import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return _stripe;
}

export async function creerSessionStripe(params: {
  montantCFA: number;
  description: string;
  paiementId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "xof",
          unit_amount: params.montantCFA,
          product_data: { name: params.description },
        },
        quantity: 1,
      },
    ],
    metadata: { paiement_id: params.paiementId },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url!;
}

export function verifierSignatureStripe(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
