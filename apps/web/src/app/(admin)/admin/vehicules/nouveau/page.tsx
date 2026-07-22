import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import VehiculeForm from "../vehicule-form";
import { creerVehicule } from "@/app/actions/vehicules";
import { BackLink } from "@/components/back-link";

export const metadata: Metadata = {
  title: "Ajouter un véhicule — Administration",
  description: "Ajoutez un nouveau véhicule à la flotte GROUP PHOEBE.",
}

export default async function NouveauVehiculePage() {
  const supabase = await createClient();

  const [
    { data: chauffeurs },
    { data: zones },
    { data: intervallesPrix },
  ] = await Promise.all([
    supabase
      .from("chauffeurs")
      .select("id, nom")
      .eq("actif", true)
      .order("nom"),
    supabase.from("zones_tarifaires").select("*"),
    supabase
      .from("intervalles_prix")
      .select("categorie_vehicule, type, prix_min, prix_max, zone_id"),
  ]);

  const zonesData = (zones ?? []).map((z) => ({
    id: z.id,
    coefficient_majoration: Number((z as Record<string, unknown>).coefficient_majoration) || 1,
  }));
  const zoneRefId = zonesData.find((z) => z.coefficient_majoration === 1)?.id;
  const intervallesRef = (intervallesPrix ?? []).filter(
    (ip) => ip.zone_id === zoneRefId
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScrollReveal variant="fade-up">
        <BackLink href="/admin/vehicules" label="Véhicules" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Nouveau véhicule
        </h1>
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <VehiculeForm
          action={creerVehicule}
          chauffeurs={chauffeurs ?? []}
          intervallesPrix={intervallesRef as { categorie_vehicule: string; type: string; prix_min: number; prix_max: number }[]}
        />
      </ScrollReveal>
    </div>
  );
}
