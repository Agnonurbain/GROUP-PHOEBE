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
    <div className="mx-auto max-w-2xl animate-fade-in">
      <BackLink href="/profil" label="Mon profil" />
      <h1 className="mb-8 mt-3 text-3xl font-bold text-phoebe-anthracite">
        Mes réservations & achats
      </h1>

      {!demandes || demandes.length === 0 ? (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-phoebe-anthracite/45">
            Aucune demande pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
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
