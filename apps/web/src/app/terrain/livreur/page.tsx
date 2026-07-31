import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import {
  ZONE_LABELS,
  MODE_LABELS,
  STATUT_LIVRAISON_LABELS,
  STATUTS_ACTIFS_LIVREUR,
  type ZoneLivraison,
  type ModeLivraison,
} from "@/lib/livraison";
import { ColisCard } from "./colis-card";

export const metadata: Metadata = {
  title: "Mes courses",
  description: "Colis affectés, statuts et preuve de livraison.",
};

function getAdmin() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function LivreurPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion?redirect=/terrain/livreur");

  const admin = getAdmin();

  const { data: livreur } = await admin
    .from("livreurs")
    .select("id, actif")
    .eq("user_id", user.sub as string)
    .single();

  // Le layout a déjà écarté les autres rôles ; reste le cas d'un compte au rôle
  // `livreur` sans ligne dans `livreurs`, ou désactivé.
  if (!livreur?.actif) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-6 text-center">
        <p className="text-sm text-public-text-muted">
          Votre compte livreur n&apos;est pas actif. Contactez l&apos;équipe.
        </p>
      </div>
    );
  }

  const { data: colis } = await admin
    .from("expeditions")
    .select("*")
    .eq("livreur_id", livreur.id)
    .in("statut", [...STATUTS_ACTIFS_LIVREUR])
    .order("created_at", { ascending: true });

  const enCours = colis ?? [];

  // Le compteur du jour porte sur les livraisons abouties, pas sur la charge :
  // c'est ce qu'un livreur regarde en fin de journée.
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const { count: livreesAujourdhui } = await admin
    .from("expeditions")
    .select("id", { count: "exact", head: true })
    .eq("livreur_id", livreur.id)
    .eq("statut", "livree")
    .gte("livree_at", debutJour.toISOString());

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Mes courses</h1>
        <span className="text-xs text-public-text-muted">
          {livreesAujourdhui ?? 0} livré{(livreesAujourdhui ?? 0) > 1 ? "s" : ""} aujourd&apos;hui
        </span>
      </div>

      {enCours.length === 0 ? (
        <div className="rounded-2xl border border-public-border bg-public-bg-card p-8 text-center">
          <p className="text-sm text-public-text-muted">
            Aucun colis en cours. Les nouvelles affectations apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-public-text-muted">
            {enCours.length} colis en cours
          </p>
          <ul className="space-y-3">
            {enCours.map((c) => (
              <li key={c.id}>
                <ColisCard
                  colis={{
                    id: c.id,
                    numeroSuivi: c.numero_suivi,
                    statut: c.statut,
                    statutLabel: STATUT_LIVRAISON_LABELS[c.statut] ?? c.statut,
                    zoneLabel: ZONE_LABELS[c.zone as ZoneLivraison] ?? c.zone,
                    modeLabel: MODE_LABELS[c.mode as ModeLivraison] ?? c.mode,
                    adresseCollecte: c.adresse_collecte,
                    adresseLivraison: c.adresse_livraison,
                    expediteurNom: c.expediteur_nom,
                    expediteurContact: c.expediteur_contact,
                    destinataireNom: c.destinataire_nom,
                    destinataireContact: c.destinataire_contact,
                    natureColis: c.nature_colis,
                    poidsKg: c.poids_kg,
                    echecMotif: (c as { echec_motif?: string | null }).echec_motif ?? null,
                  }}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
