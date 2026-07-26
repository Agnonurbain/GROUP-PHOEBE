import type { Metadata } from "next"
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import BienForm from "../bien-form";
import BienPhotosManager from "./bien-photos-manager";
import { modifierBien, supprimerBien } from "@/app/actions/biens";
import { fetchAgents } from "../agents";
import { typeBienLabel } from "@/lib/immobilier";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = {
  title: "Modifier un bien — Administration",
  description: "Modifiez les informations et le statut d'un bien immobilier GROUP PHOEBE.",
}

export default async function EditBienPage({
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

  const { data: bien } = await supabase
    .from("biens")
    .select("*")
    .eq("id", id)
    .single();

  if (!bien) redirect("/admin/biens");

  const { data: photos } = await supabase
    .from("bien_medias")
    .select("id, url, ordre")
    .eq("bien_id", id)
    .eq("type", "photo")
    .order("ordre", { ascending: true });

  const agents = await fetchAgents(supabase);

  async function handleDelete() {
    "use server";
    await supprimerBien(id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            {typeBienLabel(bien.type)} — {bien.localisation}
          </h1>
          <Link
            href="/admin/biens"
            className="text-sm text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
          >
            ← Retour à la liste
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <BienPhotosManager bienId={id} photos={photos ?? []} />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.15}>
        <BienForm bien={bien} agents={agents} action={modifierBien} />
      </ScrollReveal>

      {isProprietaire && (
        <ScrollReveal variant="fade-up" delay={0.2}>
          <section className="rounded-2xl border border-error/20 bg-error/5 p-5">
            <h2 className="mb-3 text-sm font-semibold text-error">Zone danger</h2>
            <form action={handleDelete}>
              <SubmitButton
                variant="danger"
                confirm="Supprimer définitivement ce bien et ses photos ? Cette action est irréversible."
              >
                Supprimer ce bien
              </SubmitButton>
            </form>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
