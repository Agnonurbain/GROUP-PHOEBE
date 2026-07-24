import type { Metadata } from "next"
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { EtatLieuxForm } from "./etat-lieux-form";

export const metadata: Metadata = {
  title: "État des lieux — Administration",
  description: "Saisie et consultation de l'état des lieux des véhicules GROUP PHOEBE.",
}

export default async function EtatLieuxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: demande } = await supabase
    .from("demandes_transport")
    .select("*, vehicules(marque, modele, km_inclus_par_jour, supplement_km_fcfa)")
    .eq("id", id)
    .single();

  if (!demande) notFound();

  const v = demande.vehicules as { marque: string; modele: string; km_inclus_par_jour?: number; supplement_km_fcfa?: number } | null;
  const p = demande.periode as string | null;
  const nbJours = p
    ? Math.max(1, Math.ceil((new Date(p.split(",")[1].replace(")", "")).getTime() - new Date(p.replace("[", "").split(",")[0]).getTime()) / 86400000))
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
        <ScrollReveal variant="fade-up">
          <Link
            href="/admin/demandes"
            className="inline-flex items-center gap-1.5 text-sm text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour aux demandes
          </Link>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
            État des lieux — {v ? `${v.marque} ${v.modele}` : "—"}
          </h1>
        </ScrollReveal>

        {demande.etat_lieux_depart_photos && (
          <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-phoebe-anthracite/70">
              Départ enregistré
            </h3>
            <p className="text-sm text-phoebe-anthracite">
              Kilométrage : {demande.kilometrage_depart?.toLocaleString("fr-FR")} km
              · Carburant : {demande.carburant_depart?.replace("_", " ")}
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {demande.etat_lieux_depart_photos.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt={`Départ ${i + 1}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/5"
                  unoptimized
                />
              ))}
            </div>
          </div>
          </ScrollReveal>
        )}

        {demande.etat_lieux_retour_photos && (
          <ScrollReveal variant="fade-up" delay={0.15}>
          <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-phoebe-anthracite/70">
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
                <Image
                  key={i}
                  src={url}
                  alt={`Retour ${i + 1}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl object-cover ring-1 ring-black/5"
                  unoptimized
                />
              ))}
            </div>
          </div>
          </ScrollReveal>
        )}

        {demande.statut === "acceptee" && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <EtatLieuxForm demandeId={id} type="depart" />
          </ScrollReveal>
        )}

        {demande.statut === "en_cours" && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <div className="space-y-4">
              <EtatLieuxForm
                demandeId={id}
                type="retour"
                cautionMax={demande.caution ? Number(demande.caution) : 0}
                kmDepart={demande.kilometrage_depart ?? undefined}
                carburantDepart={demande.carburant_depart ?? undefined}
                kmInclusParJour={v?.km_inclus_par_jour ?? undefined}
                supplementKmFcfa={v?.supplement_km_fcfa ?? undefined}
                nbJours={nbJours}
              />
              <a
                href={`/api/etat-lieux-pdf?id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-phoebe-anthracite px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-phoebe-anthracite/80"
              >
                PDF état des lieux départ
              </a>
            </div>
          </ScrollReveal>
        )}

        {(demande.statut === "terminee" || (demande.statut as string) === "retour_en_inspection") && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <div className="flex items-center gap-4">
              <p className="text-sm text-phoebe-green font-medium">
                {(demande.statut as string) === "retour_en_inspection"
                  ? "Inspection en cours — en attente de finalisation."
                  : "Location terminée — les deux états des lieux sont enregistrés."}
              </p>
              <a
                href={`/api/etat-lieux-pdf?id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-phoebe-anthracite px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-phoebe-anthracite/80"
              >
                Télécharger PDF
              </a>
            </div>
          </ScrollReveal>
        )}
    </div>
  );
}
