import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import ReservationForm from "./reservation-form";

export default async function ReserverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/connexion`);

  const { data: profile } = await supabase
    .from("users")
    .select("statut_verification")
    .eq("id", user.id)
    .single();

  const { data: v } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!v || v.statut !== "disponible" || !v.prix_journalier) notFound();

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

        <ReservationForm
          vehiculeId={id}
          prixJournalier={Number(v.prix_journalier)}
          tauxCaution={tauxCaution}
          chauffeurDisponible={v.chauffeur_disponible}
          verifie={verifie}
        />
      </main>
    </>
  );
}
