import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";

const DELAI_EXPIRATION_MS = 15 * 60 * 1000;

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function expirerReservationsAbandonnees(): Promise<number> {
  const admin = getAdminClient();
  const seuil = new Date(Date.now() - DELAI_EXPIRATION_MS).toISOString();

  const { data: expirees } = await admin
    .from("demandes_transport")
    .select("id, vehicule_id, chauffeur_id, periode")
    .eq("statut", "en_attente_paiement")
    .lt("created_at", seuil);

  if (!expirees || expirees.length === 0) return 0;

  let nb = 0;

  for (const d of expirees) {
    if (d.vehicule_id && d.periode) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", d.vehicule_id)
        .eq("type", "reservation")
        .eq("periode", d.periode);
    }

    if (d.chauffeur_id && d.periode) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", d.chauffeur_id)
        .eq("periode", d.periode);
    }

    await admin
      .from("paiements")
      .update({ statut: "echoue" })
      .eq("reference_table", "demandes_transport")
      .eq("reference_id", d.id)
      .eq("statut", "en_attente");

    await admin
      .from("demandes_transport")
      .update({ statut: "annulee", updated_at: new Date().toISOString() })
      .eq("id", d.id)
      .eq("statut", "en_attente_paiement");

    nb++;
  }

  return nb;
}
