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
        <div className="mb-4 text-5xl">&#10003;</div>
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
            className="rounded-lg bg-phoebe-pearl px-4 py-2 text-sm font-medium text-phoebe-anthracite hover:bg-phoebe-pearl/80"
          >
            Retour au catalogue
          </Link>
          <Link
            href="/profil"
            className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-medium text-white hover:bg-phoebe-green/90"
          >
            Voir mon profil
          </Link>
        </div>
      </main>
    </>
  );
}
