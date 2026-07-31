import type { Metadata } from "next"
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AVIS_STATUT_LABELS, AVIS_STATUT_COLORS, libelleReference } from "@/lib/avis";
import { AvisModerationForm } from "./moderation-form";

export const metadata: Metadata = {
  title: "Modérer un avis — Administration",
}

export default async function AvisModerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: avis } = await supabase
    .from("avis")
    .select("*")
    .eq("id", id)
    .single();

  if (!avis) notFound();

  const { data: clientProfile } = await supabase
    .from("users")
    .select("nom")
    .eq("id", avis.client_id)
    .single();
  const clientNom = clientProfile?.nom ?? null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/admin/avis"
          className="text-sm text-phoebe-anthracite/60 transition-colors hover:text-phoebe-green"
        >
          ← Retour aux avis
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Modérer l&apos;avis
        </h1>
      </div>

      <div className="rounded-xl border border-phoebe-pearl bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Client
            </span>
            <span className="text-phoebe-anthracite">{clientNom ?? "—"}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Service
            </span>
            <span className="text-phoebe-anthracite">{libelleReference(avis.reference_table)}</span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Note
            </span>
            <span className="text-lg text-phoebe-gold-dark" aria-label={`${avis.note} sur 5`}>
              {"★".repeat(avis.note)}{"☆".repeat(5 - avis.note)}
            </span>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Statut
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${AVIS_STATUT_COLORS[avis.statut as keyof typeof AVIS_STATUT_COLORS] ?? ""}`}>
              {AVIS_STATUT_LABELS[avis.statut as keyof typeof AVIS_STATUT_LABELS]}
            </span>
          </div>
        </div>

        {avis.titre && (
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Titre
            </span>
            <p className="text-phoebe-anthracite font-medium">{avis.titre}</p>
          </div>
        )}

        {avis.commentaire && (
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">
              Commentaire
            </span>
            <p className="text-sm text-phoebe-anthracite/80 whitespace-pre-wrap">{avis.commentaire}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-phoebe-pearl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-phoebe-anthracite mb-4">Modération</h2>
        <AvisModerationForm
          avisId={avis.id}
          statutInitial={avis.statut}
          reponseInitiale={avis.reponse_admin}
        />
      </div>
    </div>
  );
}
