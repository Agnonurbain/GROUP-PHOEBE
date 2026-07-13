import crypto from "crypto";

const CINETPAY_BASE = "https://api-checkout.cinetpay.com/v2";

export async function creerSessionCinetPay(params: {
  montantCFA: number;
  description: string;
  paiementId: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<string> {
  const body = {
    apikey: process.env.CINETPAY_API_KEY!,
    site_id: process.env.CINETPAY_SITE_ID!,
    transaction_id: params.paiementId,
    amount: params.montantCFA,
    currency: "XOF",
    description: params.description,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    channels: "ALL",
  };

  const res = await fetch(`${CINETPAY_BASE}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (json.code !== "201") {
    throw new Error(`CinetPay init error: ${json.message ?? JSON.stringify(json)}`);
  }

  return json.data.payment_url;
}

export async function verifierTransactionCinetPay(
  transactionId: string
): Promise<{ status: "ACCEPTED" | "REFUSED" | "PENDING" }> {
  const res = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY!,
      site_id: process.env.CINETPAY_SITE_ID!,
      transaction_id: transactionId,
    }),
  });

  const json = await res.json();
  const code = json?.data?.status;

  if (code === "ACCEPTED") return { status: "ACCEPTED" };
  if (code === "REFUSED") return { status: "REFUSED" };
  return { status: "PENDING" };
}

export function verifierSignatureCinetPay(
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.CINETPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
