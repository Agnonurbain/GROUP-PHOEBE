import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { periodesDues, isFrequence } from "@/lib/contrats";
import { notifierClient } from "@/lib/notifications";

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Génère les échéances dues des abonnements actifs.
 *
 * La facturation récurrente n'existait nulle part : dans le reste du produit, un
 * paiement naît d'une commande. Ici c'est le temps qui déclenche l'écriture.
 *
 * Rejouable par construction : chaque insertion est tentée et un conflit sur
 * `(contrat_id, periode_debut)` — l'index unique posé en 00069 — est ignoré.
 * Sans lui, un second passage du cron (relance, deux instances, rattrapage)
 * facturerait deux fois la même période au même client. On ne se fie pas à un
 * « a-t-on déjà facturé ce mois-ci ? » lu avant d'écrire : entre la lecture et
 * l'écriture, l'autre instance a le temps de passer.
 */
export async function genererEcheancesContrats(): Promise<number> {
  const admin = getAdmin();
  const aujourdhui = new Date();

  const { data: contrats } = await admin
    .from("contrats_recurrents")
    .select("id, client_id, date_debut, date_fin, frequence_facturation, montant_periodique, statut")
    .eq("statut", "actif");

  if (!contrats?.length) return 0;

  let creees = 0;

  for (const c of contrats) {
    // Un abonnement sans montant ni fréquence n'est pas facturable : il décrit
    // un service, pas un engagement de paiement. Le facturer à zéro produirait
    // des échéances vides que quelqu'un devrait ensuite trier.
    if (!isFrequence(c.frequence_facturation)) continue;
    const montant = Number(c.montant_periodique ?? 0);
    if (!Number.isFinite(montant) || montant <= 0) continue;

    const periodes = periodesDues(
      c.date_debut,
      c.date_fin,
      c.frequence_facturation,
      aujourdhui
    );

    for (const p of periodes) {
      const { error } = await admin.from("echeances_contrat").insert({
        contrat_id: c.id,
        periode_debut: p.debut,
        periode_fin: p.fin,
        montant,
      });

      if (!error) {
        creees++;
        continue;
      }

      // 23505 = période déjà facturée. C'est le cas nominal d'un rattrapage :
      // on repasse sur tout l'historique à chaque exécution.
      if (error.code !== "23505") {
        console.error(
          `Échéance non créée (contrat ${c.id}, période ${p.debut}) :`,
          error.message
        );
      }
    }
  }

  return creees;
}

/**
 * Marque « impayée » toute échéance facturée dont la période est écoulée.
 *
 * Sans cela, `facturee` serait un état sans sortie : rien ne distinguerait une
 * échéance récente d'une créance vieille de trois mois, et la relance se
 * ferait de mémoire.
 */
export async function marquerEcheancesImpayees(): Promise<number> {
  const admin = getAdmin();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const { data: echues } = await admin
    .from("echeances_contrat")
    .select("id, contrat_id, montant, periode_fin")
    .eq("statut", "facturee")
    .lt("periode_fin", aujourdhui);

  if (!echues?.length) return 0;

  // Les clients à prévenir, en une requête plutôt qu'une par échéance.
  const { data: contrats } = await admin
    .from("contrats_recurrents")
    .select("id, client_id")
    .in("id", [...new Set(echues.map((e) => e.contrat_id))]);
  const clientParContrat = new Map((contrats ?? []).map((c) => [c.id, c.client_id]));

  let nb = 0;
  for (const e of echues) {
    const { error, count } = await admin
      .from("echeances_contrat")
      .update({ statut: "impayee", updated_at: new Date().toISOString() }, { count: "exact" })
      .eq("id", e.id)
      .eq("statut", "facturee");

    if (error || !count) continue;
    nb++;

    const client = clientParContrat.get(e.contrat_id);
    if (client) {
      await notifierClient(
        client,
        "Échéance d'abonnement impayée",
        `L'échéance de ${Number(e.montant).toLocaleString("fr-FR")} FCFA arrivée à terme le ` +
          `${new Date(e.periode_fin).toLocaleDateString("fr-FR")} n'a pas été réglée. ` +
          `Notre équipe vous recontacte.`
      );
    }
  }

  return nb;
}
