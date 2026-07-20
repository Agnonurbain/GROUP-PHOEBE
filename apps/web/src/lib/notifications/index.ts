import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type Canal = "whatsapp" | "sms" | "email";

export type NotificationParams = {
  userId: string;
  evenement: string;
  contenu: string;
  telephone?: string;
  email?: string;
};

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function envoyerWhatsApp(telephone: string, contenu: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !token || !from) return false;

  try {
    const res = await fetchWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${from}`,
          To: `whatsapp:${telephone}`,
          Body: contenu,
        }),
      },
      { timeout: 3000 }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function envoyerSMS(telephone: string, contenu: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return false;

  try {
    const res = await fetchWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: telephone, Body: contenu }),
      },
      { timeout: 3000 }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function envoyerEmail(email: string, sujet: string, contenu: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  try {
    const res = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: sujet,
          text: contenu,
        }),
      },
      { timeout: 5000 }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function logNotification(
  userId: string,
  canal: Canal,
  evenement: string,
  contenu: string,
  ok: boolean
) {
  const admin = getAdmin();
  await admin.from("notifications_log").insert({
    user_id: userId,
    canal,
    evenement,
    contenu,
    statut_envoi: ok ? "envoye" : "echoue",
  });
}

export async function notifier(params: NotificationParams): Promise<void> {
  const { userId, evenement, contenu, telephone, email } = params;

  if (telephone) {
    const whatsappOk = await envoyerWhatsApp(telephone, contenu);
    await logNotification(userId, "whatsapp", evenement, contenu, whatsappOk);

    if (!whatsappOk) {
      const smsOk = await envoyerSMS(telephone, contenu);
      await logNotification(userId, "sms", evenement, contenu, smsOk);
    }
  }

  if (email) {
    const sujet = `GROUP PHOEBE — ${evenement}`;
    const emailOk = await envoyerEmail(email, sujet, contenu);
    await logNotification(userId, "email", evenement, contenu, emailOk);
  }
}

export async function notifierClient(
  clientId: string,
  evenement: string,
  contenu: string
): Promise<void> {
  const admin = getAdmin();
  const { data: user } = await admin
    .from("users")
    .select("telephone, email")
    .eq("id", clientId)
    .single();

  if (!user) return;

  await notifier({
    userId: clientId,
    evenement,
    contenu,
    telephone: user.telephone ?? undefined,
    email: user.email ?? undefined,
  });
}
