import { createClient } from "@/lib/supabase/server";
import VehiculeForm from "../vehicule-form";
import { creerVehicule } from "@/app/actions/vehicules";

export default async function NouveauVehiculePage() {
  const supabase = await createClient();

  const { data: chauffeurs } = await supabase
    .from("chauffeurs")
    .select("id, nom")
    .eq("actif", true)
    .order("nom");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Nouveau véhicule
      </h1>
      <VehiculeForm action={creerVehicule} chauffeurs={chauffeurs ?? []} />
    </div>
  );
}
