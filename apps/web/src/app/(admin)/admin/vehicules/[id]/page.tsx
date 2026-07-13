import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VehiculeForm from "../vehicule-form";
import PhotosManager from "./photos-manager";
import { ProposerPrixForm } from "./proposer-prix-form";
import { modifierVehicule, supprimerVehicule } from "@/app/actions/vehicules";
import { SubmitButton } from "@/components/submit-button";

export default async function EditVehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isProprietaire = profile?.role === "proprietaire";

  const { data: vehicule } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!vehicule) redirect("/admin/vehicules");

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("*")
    .eq("vehicule_id", id)
    .order("ordre", { ascending: true });

  const { data: chauffeurs } = await supabase
    .from("chauffeurs")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");

  const { data: vcLinks } = await supabase
    .from("vehicule_chauffeurs")
    .select("chauffeur_id")
    .eq("vehicule_id", id);
  const chauffeurIds = vcLinks?.map((l) => l.chauffeur_id) ?? [];

  let carteGriseUrl: string | null = null;
  let certificatUrl: string | null = null;

  if (vehicule.carte_grise_url) {
    const { data } = await supabase.storage
      .from("vehicle-documents")
      .createSignedUrl(vehicule.carte_grise_url, 3600);
    carteGriseUrl = data?.signedUrl ?? null;
  }
  if (vehicule.certificat_non_gage_url) {
    const { data } = await supabase.storage
      .from("vehicle-documents")
      .createSignedUrl(vehicule.certificat_non_gage_url, 3600);
    certificatUrl = data?.signedUrl ?? null;
  }

  async function handleDelete() {
    "use server";
    await supprimerVehicule(id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          {vehicule.marque} {vehicule.modele}
        </h1>
        <Link
          href="/admin/vehicules"
          className="text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour à la liste
        </Link>
      </div>

      <div className="flex gap-3">
        <Link
          href={`/admin/vehicules/${id}/disponibilites`}
          className="rounded-lg border border-phoebe-green px-4 py-2 text-sm font-semibold text-phoebe-green transition-colors hover:bg-phoebe-green hover:text-white"
        >
          Gérer les disponibilités
        </Link>
      </div>

      <PhotosManager vehiculeId={id} photos={photos ?? []} />

      <VehiculeForm
        vehicule={vehicule}
        action={modifierVehicule}
        documentUrls={{ carteGrise: carteGriseUrl, certificat: certificatUrl }}
        chauffeurs={chauffeurs ?? []}
        chauffeurIds={chauffeurIds}
      />

      {!isProprietaire && (
        <ProposerPrixForm
          vehiculeId={id}
          prixActuels={{
            prix_journalier: vehicule.prix_journalier,
            prix_mensuel: vehicule.prix_mensuel,
            prix_vente: vehicule.prix_vente,
          }}
        />
      )}

      {isProprietaire && (
        <section className="rounded-xl border border-error/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-error">Zone danger</h2>
          <form action={handleDelete}>
            <SubmitButton variant="danger">
              Supprimer ce véhicule
            </SubmitButton>
          </form>
        </section>
      )}
    </div>
  );
}
