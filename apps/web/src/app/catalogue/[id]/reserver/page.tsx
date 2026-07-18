import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { hasMinimumAge } from "@/lib/auth";
import ReservationForm from "./reservation-form";

export default async function ReserverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) redirect(`/connexion`);

  const { data: profile } = await supabase
    .from("users")
    .select("statut_verification, date_naissance")
    .eq("id", user.sub)
    .single();

  const { data: v } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!v || v.statut !== "disponible" || !v.prix_journalier) notFound();

  const [{ data: zones }, { data: communes }, { data: intervalles }] =
    await Promise.all([
      supabase
        .from("zones_tarifaires")
        .select("id, nom")
        .order("ordre", { ascending: true }),
      supabase
        .from("communes")
        .select("id, nom, zone_id")
        .order("nom", { ascending: true }),
      supabase
        .from("intervalles_prix")
        .select("id, zone_id, prix_min, prix_max")
        .eq("categorie_vehicule", v.categorie)
        .eq("type", "location"),
    ]);

  const profilIncomplet = !profile?.date_naissance;
  const tropJeune =
    profile?.date_naissance && !hasMinimumAge(profile.date_naissance, 21);
  const verifie = profile?.statut_verification === "verifie";
  const tauxCaution = v.taux_caution ? Number(v.taux_caution) : 0.3;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/catalogue/${id}?mode=location`}
          className="mb-4 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour à la fiche
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-phoebe-anthracite">
          Réserver — {v.marque} {v.modele}
        </h1>

        {profilIncomplet ? (
          <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/10 p-6">
            <p className="text-sm text-phoebe-anthracite">
              Vous devez renseigner votre <strong>date de naissance</strong>{" "}
              avant de pouvoir réserver. L&apos;âge minimum requis est de 21 ans.
            </p>
            <Link
              href="/profil"
              className="mt-4 inline-block rounded-lg bg-phoebe-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-phoebe-green-deep"
            >
              Compléter mon profil
            </Link>
          </div>
        ) : tropJeune ? (
          <div className="rounded-xl border border-error/30 bg-error/10 p-6">
            <p className="text-sm text-error">
              Vous devez avoir au moins <strong>21 ans</strong> pour effectuer
              une réservation.
            </p>
          </div>
        ) : (
          <ReservationForm
            vehiculeId={id}
            prixJournalier={Number(v.prix_journalier)}
            tauxCaution={tauxCaution}
            chauffeurDisponible={v.chauffeur_disponible}
            verifie={verifie}
            communes={(communes ?? []).map((c) => ({ id: c.id, nom: c.nom, zone_id: c.zone_id }))}
            zones={(zones ?? []).map((z) => ({ id: z.id, nom: z.nom }))}
            intervalles={(intervalles ?? []).map((ip) => ({ id: ip.id, zone_id: ip.zone_id, prix_min: Number(ip.prix_min), prix_max: Number(ip.prix_max) }))}
          />
        )}
      </main>
    </>
  );
}
