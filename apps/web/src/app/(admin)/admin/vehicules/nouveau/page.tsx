import VehiculeForm from "../vehicule-form";
import { creerVehicule } from "@/app/actions/vehicules";

export default function NouveauVehiculePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Nouveau véhicule
      </h1>
      <VehiculeForm action={creerVehicule} />
    </div>
  );
}
