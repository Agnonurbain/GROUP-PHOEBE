import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { ReservationCard } from "./reservation-card";

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: demandes } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele), lignes_demande(id, vehicule_id, avec_chauffeur, montant_ligne, vehicules(marque, modele))")
    .eq("client_id", user.sub)
    .order("created_at", { ascending: false });

  const { data: avisExistants } = await supabase
    .from("avis_transport")
    .select("demande_id")
    .in(
      "demande_id",
      (demandes ?? []).filter((d) => d.statut === "terminee").map((d) => d.id)
    );

  const avisSet = new Set(avisExistants?.map((a) => a.demande_id) ?? []);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/profil" label="Mon profil" />
      <h1 className="mb-6 mt-2 text-2xl font-bold text-phoebe-anthracite">
        Mes réservations
      </h1>

      {!demandes || demandes.length === 0 ? (
        <p className="text-sm text-phoebe-anthracite/50">
          Aucune réservation pour le moment.
        </p>
      ) : (
        <div className="space-y-4">
          {demandes.map((d) => (
            <ReservationCard
              key={d.id}
              demande={d}
              vehicule={d.vehicules}
              dejaNote={avisSet.has(d.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
