import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import BienForm from "../bien-form";
import { creerBien } from "@/app/actions/biens";
import { BackLink } from "@/components/back-link";
import { fetchAgents } from "../agents";

export const metadata: Metadata = {
  title: "Ajouter un bien — Administration",
  description: "Ajoutez un bien au catalogue immobilier GROUP PHOEBE.",
}

export default async function NouveauBienPage() {
  const supabase = await createClient();

  // Créer un bien revient à en fixer le prix (colonne NOT NULL) : la page est
  // donc réservée au propriétaire, sinon le formulaire échouerait à coup sûr.
  const { data: claimsData } = await supabase.auth.getClaims();
  const { data: profile } = claimsData?.claims
    ? await supabase.from("users").select("role").eq("id", claimsData.claims.sub).single()
    : { data: null };
  if (profile?.role !== "proprietaire") redirect("/admin/biens");

  const agents = await fetchAgents(supabase);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScrollReveal variant="fade-up">
        <BackLink href="/admin/biens" label="Biens" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Nouveau bien
        </h1>
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <BienForm action={creerBien} agents={agents} estProprietaire />
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.15}>
        <p className="text-sm text-phoebe-anthracite/70">
          Les photos s&apos;ajoutent après la création, depuis la fiche du bien.
        </p>
      </ScrollReveal>
    </div>
  );
}
