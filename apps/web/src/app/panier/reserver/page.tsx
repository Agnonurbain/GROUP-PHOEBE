import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";
import { ScrollReveal } from "@/components/effects";

export const metadata = { title: "Finaliser la réservation" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/inscription?redirect=/panier");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("statut_verification")
    .eq("id", user.sub)
    .single();

  const verifie = profile?.statut_verification === "verifie";

  const [{ data: zones }, { data: communes }, { data: intervalles }] =
    await Promise.all([
      supabase
        .from("zones_tarifaires")
        .select("id, nom")
        .order("ordre", { ascending: true }),
      supabase.from("communes").select("id, nom, zone_id").order("nom"),
      supabase
        .from("intervalles_prix")
        .select("id, zone_id, categorie_vehicule, prix_min, prix_max")
        .eq("type", "location"),
    ]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <BackLink href="/panier" label="Panier" />
        <ScrollReveal variant="fade-up">
          <h1 className="mb-8 mt-3 text-3xl font-bold text-phoebe-anthracite">
            Finaliser la réservation
          </h1>
        </ScrollReveal>
        <ScrollReveal variant="fade-up" delay={0.1}>
          <CheckoutForm
            verifie={verifie}
            zones={zones ?? []}
            communes={communes ?? []}
            intervalles={intervalles ?? []}
          />
        </ScrollReveal>
      </main>
    </>
  );
}
