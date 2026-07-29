import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { getParametresImmobilier } from "@/lib/public-cache";
import { ParametresImmoForm } from "./form";

export const metadata: Metadata = {
  title: "Paramètres Immobilier — Administration",
  description: "Configurez les paramètres du module immobilier GROUP PHOEBE.",
}

export default async function ParametresImmobilierPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") redirect("/admin");

  const params = await getParametresImmobilier();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <ScrollReveal variant="fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Paramètres Immobilier
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/70">
          Configurez les règles de fonctionnement du module immobilier.
        </p>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <ParametresImmoForm
          initial={{
            caution_visite: params.caution_visite,
            taux_max_reduction: params.taux_max_reduction,
            max_offres_client: params.max_offres_client,
          }}
        />
      </ScrollReveal>
    </div>
  );
}
