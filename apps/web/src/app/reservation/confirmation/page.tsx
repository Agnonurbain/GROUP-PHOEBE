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
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center animate-fade-in">
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect behind icon */}
            <div className="absolute inset-0 rounded-full bg-phoebe-green/20 blur-xl animate-scale-in" />
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#39A044" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative glow-green">
              <circle cx="12" cy="12" r="10" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-phoebe-anthracite">
          Paiement enregistré
        </h1>
        <p className="mb-8 max-w-sm text-phoebe-anthracite/55 leading-relaxed">
          Votre réservation{vehiculeLabel ? ` pour le ${vehiculeLabel}` : ""}{" "}
          est en attente de validation par notre équipe. Vous recevrez une
          notification dès qu&#39;elle sera confirmée.
        </p>
        <div className="flex gap-4">
          <Link
            href="/catalogue"
            className="rounded-2xl border border-phoebe-pearl bg-white px-6 py-3.5 text-sm font-semibold text-phoebe-anthracite shadow-sm transition-all hover:shadow-lg hover:border-phoebe-anthracite/20"
          >
            Retour au catalogue
          </Link>
          <Link
            href="/profil"
            className="relative overflow-hidden rounded-2xl bg-phoebe-green px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-lg"
          >
            <span className="relative z-10">Voir mon profil</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
          </Link>
        </div>
      </main>
    </>
  );
}
