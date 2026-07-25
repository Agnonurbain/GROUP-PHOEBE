"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { checkRateLimit } from "@/lib/rate-limit";

export type ContactState = {
  error?: string;
  success?: boolean;
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Message de contact public : pas de table dédiée → on notifie l'équipe via
// notifications_log (visible dans la cloche admin). Insertion en service-role
// car l'expéditeur peut être anonyme.
export async function envoyerMessageContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const prenom = ((formData.get("prenom") as string) || "").trim();
  const nom = ((formData.get("nom") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const telephone = ((formData.get("telephone") as string) || "").trim();
  const sujet = ((formData.get("sujet") as string) || "Autre").trim();
  const message = ((formData.get("message") as string) || "").trim();

  if (!prenom && !nom) {
    return { error: "Veuillez indiquer votre nom." };
  }
  if (!email && !telephone) {
    return { error: "Indiquez un email ou un téléphone pour vous recontacter." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "L'adresse email n'est pas valide." };
  }
  if (message.length < 10) {
    return { error: "Votre message doit contenir au moins 10 caractères." };
  }

  const cle = email || telephone || "anonyme";
  if (!checkRateLimit(`contact:${cle}`)) {
    return { error: "Trop de messages envoyés. Réessayez dans une minute." };
  }

  const admin = getAdmin();

  const { data: admins } = await admin
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (admins && admins.length > 0) {
    const contact = [email, telephone].filter(Boolean).join(" · ");
    const rows = admins.map((a) => ({
      user_id: a.id,
      canal: "push" as const,
      evenement: "message_contact",
      contenu: JSON.stringify({
        titre: `Contact — ${sujet}`,
        message: `${prenom} ${nom} (${contact}) : ${message}`.trim(),
        lien: "/admin",
      }),
      statut_envoi: "envoye" as const,
    }));
    await admin.from("notifications_log").insert(rows as never[]);
  }

  return { success: true };
}
