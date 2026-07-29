import { createClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { notifierClient } from "@/lib/notifications";

function getAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Les demandes immobilières sans réponse depuis 7 jours sont automatiquement refusées.
const DELAI_EXPIRATION_JOURS = 7;
const DELAI_MS = DELAI_EXPIRATION_JOURS * 24 * 60 * 60 * 1000;

export async function expirerDemandesImmobilierSansReponse(): Promise<number> {
  const admin = getAdmin();
  const seuil = new Date(Date.now() - DELAI_MS).toISOString();

  // « contre_offre » incluse : sans réponse du client, le bien resterait
  // réservé indéfiniment.
  const { data: expirees } = await admin
    .from("demandes_immobilier")
    .select("id, client_id, bien_id, statut")
    .in("statut", ["en_attente", "en_cours_traitement", "contre_offre"])
    .lt("updated_at", seuil);

  if (!expirees || expirees.length === 0) return 0;

  let nb = 0;
  for (const d of expirees) {
    // Remettre le bien à disponible s'il était réservé
    await admin
      .from("biens")
      .update({ statut: "disponible", updated_at: new Date().toISOString() })
      .eq("id", d.bien_id)
      .eq("statut", "reserve");

    await admin
      .from("demandes_immobilier")
      .update({ statut: "refusee", updated_at: new Date().toISOString() })
      .eq("id", d.id);

    await notifierClient(
      d.client_id,
      "Demande immobilière expirée",
      d.statut === "contre_offre"
        ? `La contre-offre du propriétaire a expiré faute de réponse sous ${DELAI_EXPIRATION_JOURS} jours. Vous pouvez soumettre une nouvelle offre à tout moment.`
        : `Votre demande a été automatiquement refusée faute de réponse sous ${DELAI_EXPIRATION_JOURS} jours. Vous pouvez soumettre une nouvelle demande à tout moment.`
    );

    nb++;
  }

  return nb;
}
