import type { Metadata } from "next"
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { PublierButton } from "./publier-button";

export const metadata: Metadata = {
  title: "Blog & Guides — Administration",
  description: "Gérez les articles du blog et guides GROUP PHOEBE.",
}

export default async function BlogListPage() {
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
    redirect("/admin");
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("*, categories_article(nom)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Blog & Guides
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/blog/categories"
            className="rounded-xl border border-phoebe-anthracite/12 px-5 py-2.5 text-sm font-semibold text-phoebe-anthracite transition-all hover:bg-phoebe-pearl"
          >
            Catégories
          </Link>
          <Link
            href="/admin/blog/nouveau"
            className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
          >
            + Nouvel article
          </Link>
        </div>
      </div>

      {articles && articles.length > 0 ? (
        <ScrollReveal>
          <div className="overflow-x-auto rounded-2xl border border-phoebe-pearl bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                <tr>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Image</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Titre</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Catégorie</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Auteur</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Statut</th>
                  <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/70">Date</th>
                  <th scope="col" className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-phoebe-pearl/70">
                {articles.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-phoebe-pearl/40">
                    <td className="px-5 py-3.5">
                      {a.image_couverture ? (
                        <div className="group/img relative h-10 w-14 overflow-hidden rounded-lg ring-1 ring-black/5">
                          <Image
                            src={a.image_couverture}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-phoebe-pearl text-xs text-phoebe-anthracite/70">
                          —
                        </div>
                      )}
                    </td>
                    <td className="max-w-[240px] px-5 py-3.5">
                      <span className="font-semibold text-phoebe-anthracite line-clamp-1">
                        {a.titre}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {(a.categories_article as { nom: string } | null)?.nom ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-phoebe-anthracite/70">
                      {a.auteur ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <PublierButton articleId={a.id} publie={a.publie} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-phoebe-anthracite/70">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/blog/${a.id}`}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-phoebe-green transition-all hover:bg-phoebe-green/10 hover:text-phoebe-green-deep"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      ) : (
        <p className="text-sm text-phoebe-anthracite/70">
          Aucun article pour le moment. Cliquez sur « Nouvel article » pour rédiger le premier.
        </p>
      )}
    </div>
  );
}
