import type { Metadata } from "next"
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import ArticleForm from "../article-form";
import { creerArticle, supprimerArticle } from "@/app/actions/blog";
import { SubmitButton } from "@/components/submit-button";

export const metadata: Metadata = {
  title: "Modifier un article — Administration",
  description: "Modifiez un article du blog GROUP PHOEBE.",
}

export default async function EditArticlePage({
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
  if (!profile || !["operateur", "proprietaire", "agent_immobilier"].includes(profile.role)) {
    redirect("/admin/blog");
  }

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!article) redirect("/admin/blog");

  const { data: categories } = await supabase
    .from("categories_article")
    .select("*")
    .order("ordre", { ascending: true });

  async function handleDelete() {
    "use server";
    await supprimerArticle(id);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            {article.titre}
          </h1>
          <Link
            href="/admin/blog"
            className="text-sm text-phoebe-anthracite/70 transition-colors hover:text-phoebe-green"
          >
            ← Retour à la liste
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <ArticleForm article={article} action={creerArticle} categories={categories ?? []} />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.2}>
        <section className="rounded-2xl border border-error/20 bg-error/5 p-5">
          <h2 className="mb-3 text-sm font-semibold text-error">Zone danger</h2>
          <form action={handleDelete}>
            <SubmitButton
              variant="danger"
              confirm="Supprimer définitivement cet article ? Cette action est irréversible."
            >
              Supprimer cet article
            </SubmitButton>
          </form>
        </section>
      </ScrollReveal>
    </div>
  );
}
