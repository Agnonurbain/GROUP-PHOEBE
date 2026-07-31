import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import ArticleForm from "../article-form";
import { creerArticle } from "@/app/actions/blog";
import { BackLink } from "@/components/back-link";

export const metadata: Metadata = {
  title: "Nouvel article — Administration",
  description: "Rédigez un nouvel article pour le blog GROUP PHOEBE.",
}

export default async function NouvelArticlePage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (!profile || !["operateur", "proprietaire", "agent_immobilier"].includes(profile.role)) {
    redirect("/admin/blog");
  }

  const { data: categories } = await supabase
    .from("categories_article")
    .select("*")
    .order("ordre", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ScrollReveal variant="fade-up">
        <BackLink href="/admin/blog" label="Blog & Guides" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Nouvel article
        </h1>
      </ScrollReveal>
      <ScrollReveal variant="fade-up" delay={0.1}>
        <ArticleForm action={creerArticle} categories={categories ?? []} />
      </ScrollReveal>
    </div>
  );
}
