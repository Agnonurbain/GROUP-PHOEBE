import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { BackLink } from "@/components/back-link";
import { CategorieForm } from "./categorie-form";
import { SupprimerCategorieButton } from "./supprimer-categorie-button";

export const metadata: Metadata = {
  title: "Catégories blog — Administration",
  description: "Gérez les catégories d'articles du blog GROUP PHOEBE.",
}

export default async function CategoriesPage() {
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
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal variant="fade-up">
        <BackLink href="/admin/blog" label="Blog & Guides" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Catégories
        </h1>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold tracking-tight text-phoebe-anthracite">
            Nouvelle catégorie
          </h2>
          <CategorieForm />
        </div>
      </ScrollReveal>

      {categories && categories.length > 0 && (
        <ScrollReveal variant="fade-up" delay={0.15}>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Nom</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Slug</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Description</th>
                  <th scope="col" className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Ordre</th>
                  <th scope="col" className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {categories.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5 font-semibold text-phoebe-anthracite">
                      {c.nom}
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {c.slug}
                    </td>
                    <td className="max-w-[200px] px-5 py-3.5 text-xs text-phoebe-anthracite/70 line-clamp-1">
                      {c.description ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center text-phoebe-anthracite/70">
                      {c.ordre}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <SupprimerCategorieButton id={c.id} nom={c.nom} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
