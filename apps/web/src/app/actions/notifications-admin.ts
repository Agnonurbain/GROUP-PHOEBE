"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

export type NotifAdmin = {
  id: string;
  titre: string;
  message: string;
  lien: string | null;
  created_at: string;
  lue: boolean;
};

export async function notifierAdminNouvelleReservation(
  demandeId: string,
  clientNom: string,
  nbVehicules: number,
  montant: number
) {
  const supabase = await createClient();

  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (!admins || admins.length === 0) return;

  const rows = admins.map((a) => ({
    user_id: a.id,
    canal: "push" as const,
    evenement: "nouvelle_reservation",
    contenu: JSON.stringify({
      titre: "Nouvelle réservation",
      message: `${clientNom} · ${nbVehicules} véhicule${nbVehicules > 1 ? "s" : ""} · ${montant.toLocaleString("fr-FR")} FCFA`,
      lien: `/admin/demandes`,
    }),
    statut_envoi: "envoye" as const,
  }));

  await supabase.from("notifications_log").insert(rows as never[]);
}

export async function notifierAdminNouveauDossierVoyage(
  _dossierId: string,
  clientNom: string,
  pays: string,
  offre: string,
  montantEstime: number | null
) {
  const supabase = await createClient();

  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (!admins || admins.length === 0) return;

  const rows = admins.map((a) => ({
    user_id: a.id,
    canal: "push" as const,
    evenement: "nouveau_dossier_voyage",
    contenu: JSON.stringify({
      titre: "Nouveau dossier visa",
      message: `${clientNom} · Visa ${pays} · ${offre} · ${montantEstime === null ? "Sur devis" : `~${montantEstime.toLocaleString("fr-FR")} FCFA`}`,
      lien: `/admin`,
    }),
    statut_envoi: "envoye" as const,
  }));

  await supabase.from("notifications_log").insert(rows as never[]);
}

export async function notifierAdminNouvelleDemandeImmobilier(
  _demandeId: string,
  clientNom: string,
  bien: string,
  typeLabel: string,
  detail: string
) {
  const supabase = await createClient();

  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (!admins || admins.length === 0) return;

  const rows = admins.map((a) => ({
    user_id: a.id,
    canal: "push" as const,
    evenement: "nouvelle_demande_immobilier",
    contenu: JSON.stringify({
      titre: "Nouvelle demande immobilier",
      message: `${clientNom} · ${typeLabel} · ${bien}${detail ? ` · ${detail}` : ""}`,
      lien: `/admin/demandes-immobilier`,
    }),
    statut_envoi: "envoye" as const,
  }));

  await supabase.from("notifications_log").insert(rows as never[]);
}

// Réponse du client à une contre-offre. Contrairement aux notifieurs
// ci-dessus, celui-ci écrit avec la clé de service : il est appelé depuis la
// session d'un client, qui n'a pas le droit de lister le staff ni d'insérer
// une notification destinée à autrui.
export async function notifierAdminReponseContreOffre(
  clientNom: string,
  bien: string,
  accepte: boolean,
  montant: number
) {
  const admin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: destinataires } = await admin
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (!destinataires || destinataires.length === 0) return;

  const rows = destinataires.map((a) => ({
    user_id: a.id,
    canal: "push" as const,
    evenement: "reponse_contre_offre_immobilier",
    contenu: JSON.stringify({
      titre: accepte ? "Contre-offre acceptée" : "Contre-offre refusée",
      message: `${clientNom} · ${bien} · ${montant.toLocaleString("fr-FR")} FCFA`,
      lien: `/admin/demandes-immobilier`,
    }),
    statut_envoi: "envoye" as const,
  }));

  await admin.from("notifications_log").insert(rows as never[]);
}

export async function getNotificationsAdmin(): Promise<{
  nonLues: number;
  recentes: NotifAdmin[];
}> {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return { nonLues: 0, recentes: [] };

  const { count: nonLues } = await supabase
    .from("notifications_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.sub)
    .eq("canal", "push")
    .eq("statut_envoi", "envoye");

  const { data: recentes } = await supabase
    .from("notifications_log")
    .select("id, evenement, contenu, created_at, statut_envoi")
    .eq("user_id", user.sub)
    .eq("canal", "push")
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    nonLues: nonLues ?? 0,
    recentes: (recentes ?? []).map((n) => {
      let parsed = { titre: n.evenement, message: "", lien: null as string | null };
      try {
        const c = JSON.parse(n.contenu ?? "{}");
        parsed = { titre: c.titre ?? n.evenement, message: c.message ?? "", lien: c.lien ?? null };
      } catch {}
      return {
        id: n.id,
        titre: parsed.titre,
        message: parsed.message,
        lien: parsed.lien,
        created_at: n.created_at,
        lue: n.statut_envoi === "lu",
      };
    }),
  };
}

export async function marquerNotificationLue(id: string) {
  const supabase = await createClient();
  await supabase
    .from("notifications_log")
    .update({ statut_envoi: "lu" })
    .eq("id", id);
  revalidatePath("/admin");
}

export async function marquerToutesLues() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) return;

  await supabase
    .from("notifications_log")
    .update({ statut_envoi: "lu" })
    .eq("user_id", user.sub)
    .eq("canal", "push")
    .eq("statut_envoi", "envoye");
  revalidatePath("/admin");
}
