import type { Metadata } from "next"
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import VehiculeForm from "../vehicule-form";
import PhotosManager from "./photos-manager";
import { ProposerPrixForm } from "./proposer-prix-form";
import { ProposerModificationZoneForm } from "@/components/proposer-modification-zone-form";
import { MaintenanceSection } from "./maintenance-section";
import { modifierVehicule, supprimerVehicule } from "@/app/actions/vehicules";
import { GpsCapture } from "@/components/gps-capture";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = {
  title: "Modifier un véhicule — Administration",
  description: "Modifiez les informations et tarifs d'un véhicule GROUP PHOEBE.",
}

function parsePeriode(raw: string | null): { debut: string; fin: string } {
  if (!raw) return { debut: "—", fin: "—" };
  const cleaned = raw.replace(/[\[\]()]/g, "");
  const [debut, fin] = cleaned.split(",");
  return {
    debut: new Date(debut.trim()).toLocaleDateString("fr-FR"),
    fin: new Date(fin.trim()).toLocaleDateString("fr-FR"),
  };
}

export default async function EditVehiculePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
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

  const { data: zones } = await supabase.from("zones_tarifaires").select("*").order("ordre");
  const zonesData = (zones ?? []).map((z) => ({
    id: z.id,
    coefficient_majoration: Number((z as Record<string, unknown>).coefficient_majoration) || 1,
  }));
  const zonesFormData = (zones ?? []).map((z) => ({
    id: z.id,
    nom: z.nom,
    coefficient_majoration: Number((z as Record<string, unknown>).coefficient_majoration) || 1,
    caution_multiplicateur: Number((z as Record<string, unknown>).caution_multiplicateur) || 1,
    km_inclus_par_jour: Number((z as Record<string, unknown>).km_inclus_par_jour) || 150,
    supplement_km_fcfa: Number((z as Record<string, unknown>).supplement_km_fcfa) || 200,
    tarif_chauffeur_journalier: Number((z as Record<string, unknown>).tarif_chauffeur_journalier) || 10000,
  }));
  const { data: intervallesPrix } = await supabase
    .from("intervalles_prix")
    .select("categorie_vehicule, type, prix_min, prix_max, zone_id");
  const zoneRefId = zonesData.find((z) => z.coefficient_majoration === 1)?.id;
  const intervallesRef = (intervallesPrix ?? []).filter(
    (ip) => ip.zone_id === zoneRefId
  );

  const { data: maintenances } = await supabase
    .from("disponibilites_vehicule")
    .select("*")
    .eq("vehicule_id", id)
    .eq("type", "maintenance")
    .order("periode", { ascending: false })
    .limit(10);

  async function handleDelete() {
    "use server";
    await supprimerVehicule(id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            {vehicule.marque} {vehicule.modele}
          </h1>
          <Link
            href="/admin/vehicules"
            className="text-sm text-phoebe-anthracite/50 transition-colors hover:text-phoebe-green"
          >
            ← Retour à la liste
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <div className="flex gap-3">
          <Link
            href={`/admin/vehicules/${id}/disponibilites`}
            className="rounded-xl border border-phoebe-green px-5 py-2.5 text-sm font-semibold text-phoebe-green shadow-sm transition-all hover:bg-phoebe-green hover:text-white hover:shadow-md"
          >
            Gérer les disponibilités
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.15}>
        <PhotosManager vehiculeId={id} photos={photos ?? []} />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.18}>
        <section className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <GpsCapture
            vehiculeId={id}
            latitude={vehicule.latitude as unknown as number | null}
            longitude={vehicule.longitude as unknown as number | null}
          />
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.2}>
        <VehiculeForm
          vehicule={vehicule}
          action={modifierVehicule}
          chauffeurs={chauffeurs ?? []}
          chauffeurIds={chauffeurIds}
          intervallesPrix={intervallesRef as { categorie_vehicule: string; type: string; prix_min: number; prix_max: number }[]}
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.22}>
        <MaintenanceSection
          vehiculeId={id}
          maintenances={(maintenances ?? []) as { id: string; periode: string | null }[]}
        />
      </ScrollReveal>

      {!isProprietaire && (
        <>
          <ScrollReveal variant="fade-up" delay={0.25}>
            <ProposerPrixForm
              vehiculeId={id}
              prixActuels={{
                prix_journalier: vehicule.prix_journalier,
                prix_mensuel: vehicule.prix_mensuel,
                prix_vente: vehicule.prix_vente,
              }}
            />
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={0.28}>
            <ProposerModificationZoneForm zones={zonesFormData} />
          </ScrollReveal>
        </>
      )}

      {isProprietaire && (
        <ScrollReveal variant="fade-up" delay={0.25}>
          <section className="rounded-2xl border border-error/20 bg-error/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-error">Zone danger</h2>
            <form action={handleDelete}>
              <SubmitButton variant="danger">
                Supprimer ce véhicule
              </SubmitButton>
            </form>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
