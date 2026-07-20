import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/back-link";
import { ScrollReveal } from "@/components/effects";
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
      <h1 className="mb-8 mt-3 text-3xl font-bold tracking-tight text-phoebe-anthracite">
        Mes réservations <span className="text-gradient-gold">&amp; achats</span>
      </h1>

      {!demandes || demandes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-phoebe-pearl bg-white py-16 text-center shadow-sm animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-phoebe-pearl/60">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-anthracite/25">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-phoebe-anthracite">Aucune réservation pour le moment</p>
            <p className="mt-1 text-sm text-phoebe-anthracite/40">
              Dès que vous réserverez un véhicule, vos demandes apparaîtront ici.
            </p>
          </div>
          <Link
            href="/catalogue"
            className="rounded-2xl bg-phoebe-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep"
          >
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {demandes.map((d, i) => (
            <ScrollReveal key={d.id} variant="fade-up" delay={i * 0.08}>
              <ReservationCard
                demande={d}
                vehicule={d.vehicules}
                dejaNote={avisSet.has(d.id)}
              />
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
