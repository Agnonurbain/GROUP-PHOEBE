import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import VehiculeForm from "../vehicule-form";
import { creerVehicule } from "@/app/actions/vehicules";
import { BackLink } from "@/components/back-link";

export default async function NouveauVehiculePage() {
  const supabase = await createClient();

  const { data: chauffeurs } = await supabase
    .from("chauffeurs")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScrollReveal variant="fade-up">
        <BackLink href="/admin/vehicules" label="Véhicules" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Nouveau véhicule
        </h1>
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <VehiculeForm action={creerVehicule} chauffeurs={chauffeurs ?? []} />
      </ScrollReveal>
    </div>
  );
}
