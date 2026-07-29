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

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Notifie tout le staff. Écrit avec la clé de service, et c'est le fond du
 * sujet : ces notifieurs sont appelés depuis la session d'un client (une
 * réservation, une demande immobilière, un dossier voyage). Or la policy
 * `users_select_own` limite un client à sa propre ligne, donc le `select` du
 * staff renvoyait zéro ligne et la fonction sortait sans rien écrire — aucune
 * notification n'était jamais créée pour une demande client. Depuis 00048,
 * `notifications_log` n'a de surcroît aucune policy d'insertion : seule la clé
 * de service peut écrire ici.
 */
async function notifierStaff(params: {
  evenement: string;
  titre: string;
  message: string;
  lien: string;
}) {
  const admin = getAdmin();

  const { data: destinataires } = await admin
    .from("users")
    .select("id")
    .in("role", ["operateur", "proprietaire"]);

  if (!destinataires || destinataires.length === 0) return;

  const rows = destinataires.map((d) => ({
    user_id: d.id,
    canal: "push" as const,
    evenement: params.evenement,
    contenu: JSON.stringify({
      titre: params.titre,
      message: params.message,
      lien: params.lien,
    }),
    statut_envoi: "envoye" as const,
  }));

  await admin.from("notifications_log").insert(rows as never[]);
}

export async function notifierAdminNouvelleReservation(
  demandeId: string,
  clientNom: string,
  nbVehicules: number,
  montant: number
) {
  await notifierStaff({
    evenement: "nouvelle_reservation",
    titre: "Nouvelle réservation",
    message: `${clientNom} · ${nbVehicules} véhicule${nbVehicules > 1 ? "s" : ""} · ${montant.toLocaleString("fr-FR")} FCFA`,
    lien: `/admin/demandes`,
  });
}

export async function notifierAdminNouveauDossierVoyage(
  _dossierId: string,
  clientNom: string,
  pays: string,
  offre: string,
  montantEstime: number | null
) {
  await notifierStaff({
    evenement: "nouveau_dossier_voyage",
    titre: "Nouveau dossier visa",
    message: `${clientNom} · Visa ${pays} · ${offre} · ${montantEstime === null ? "Sur devis" : `~${montantEstime.toLocaleString("fr-FR")} FCFA`}`,
    lien: `/admin`,
  });
}

export async function notifierAdminNouvelleDemandeImmobilier(
  _demandeId: string,
  clientNom: string,
  bien: string,
  typeLabel: string,
  detail: string
) {
  await notifierStaff({
    evenement: "nouvelle_demande_immobilier",
    titre: "Nouvelle demande immobilier",
    message: `${clientNom} · ${typeLabel} · ${bien}${detail ? ` · ${detail}` : ""}`,
    lien: `/admin/demandes-immobilier`,
  });
}

export async function notifierAdminReponseContreOffre(
  clientNom: string,
  bien: string,
  accepte: boolean,
  montant: number
) {
  await notifierStaff({
    evenement: "reponse_contre_offre_immobilier",
    titre: accepte ? "Contre-offre acceptée" : "Contre-offre refusée",
    message: `${clientNom} · ${bien} · ${montant.toLocaleString("fr-FR")} FCFA`,
    lien: `/admin/demandes-immobilier`,
  });
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
