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
          href={`/catalogue/${id}`}
          className="mb-4 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour à la fiche
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-phoebe-anthracite">
          Réserver — {v.marque} {v.modele}
        </h1>

        <div className="mb-6 rounded-xl bg-phoebe-pearl p-4 text-sm text-phoebe-anthracite/70">
          <span className="font-semibold text-phoebe-green">
            {Number(v.prix_journalier).toLocaleString("fr-FR")} FCFA
          </span>{" "}
          / jour · {v.localisation ?? "—"}
        </div>

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
          />
        )}
      </main>
    </>
  );
}
