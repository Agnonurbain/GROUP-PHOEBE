import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EtatLieuxForm } from "./etat-lieux-form";

export default async function EtatLieuxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele)")
    .eq("id", id)
    .single();

  if (!demande) notFound();

  const v = demande.vehicules;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/admin/demandes"
          className="inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour aux demandes
        </Link>

        <h1 className="text-2xl font-bold text-phoebe-anthracite">
          État des lieux — {v ? `${v.marque} ${v.modele}` : "—"}
        </h1>

        {demande.etat_lieux_depart_photos && (
          <div className="rounded-xl bg-phoebe-pearl p-4">
            <h3 className="mb-2 text-sm font-semibold text-phoebe-anthracite/60">
              Départ enregistré
            </h3>
            <p className="text-sm text-phoebe-anthracite">
              Kilométrage : {demande.kilometrage_depart?.toLocaleString("fr-FR")} km
              · Carburant : {demande.carburant_depart?.replace("_", " ")}
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {demande.etat_lieux_depart_photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Départ ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {demande.etat_lieux_retour_photos && (
          <div className="rounded-xl bg-phoebe-pearl p-4">
            <h3 className="mb-2 text-sm font-semibold text-phoebe-anthracite/60">
              Retour enregistré
            </h3>
            <p className="text-sm text-phoebe-anthracite">
              Kilométrage : {demande.kilometrage_retour?.toLocaleString("fr-FR")} km
              · Carburant : {demande.carburant_retour?.replace("_", " ")}
              {demande.caution_retenue > 0 && (
                <span className="ml-2 text-error font-medium">
                  · {Number(demande.caution_retenue).toLocaleString("fr-FR")} FCFA retenus
                </span>
              )}
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {demande.etat_lieux_retour_photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Retour ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {demande.statut === "acceptee" && (
          <EtatLieuxForm demandeId={id} type="depart" />
        )}

        {demande.statut === "en_cours" && (
          <EtatLieuxForm
            demandeId={id}
            type="retour"
            cautionMax={demande.caution ? Number(demande.caution) : 0}
          />
        )}

        {demande.statut === "terminee" && (
          <p className="text-sm text-phoebe-green font-medium">
            Location terminée — les deux états des lieux sont enregistrés.
          </p>
        )}
    </div>
  );
}
