import Link from "next/link";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ demande?: string }>;
}) {
  const { demande: demandeId } = await searchParams;

  let vehiculeLabel = "";

  if (demandeId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("demandes_transport")
      .select("vehicule_id, vehicules(marque, modele)")
      .eq("id", demandeId)
      .single();

    if (data?.vehicules) {
      const v = data.vehicules;
      vehiculeLabel = `${v.marque} ${v.modele}`;
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#39A044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-phoebe-anthracite">
          Paiement enregistré
        </h1>
        <p className="mb-6 text-phoebe-anthracite/70">
          Votre réservation{vehiculeLabel ? ` pour le ${vehiculeLabel}` : ""}{" "}
          est en attente de validation par notre équipe. Vous recevrez une
          notification dès qu'elle sera confirmée.
        </p>
        <div className="flex gap-4">
          <Link
            href="/catalogue"
            className="rounded-xl bg-phoebe-pearl px-5 py-2.5 text-sm font-medium text-phoebe-anthracite transition-all hover:bg-phoebe-pearl/80 hover:shadow-sm"
          >
            Retour au catalogue
          </Link>
          <Link
            href="/profil"
            className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
          >
            Voir mon profil
          </Link>
        </div>
      </main>
    </>
  );
}
