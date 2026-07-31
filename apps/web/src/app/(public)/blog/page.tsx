import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { BlogPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Blog & Guides — GROUP PHOEBE",
  description:
    "Conseils, guides et actualités sur le transport, l'immobilier, l'assistance voyages et la livraison en Côte d'Ivoire.",
  openGraph: {
    title: "Blog & Guides — GROUP PHOEBE",
    description:
      "Retrouvez nos articles et guides pratiques pour vos projets en Côte d'Ivoire.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Guides — GROUP PHOEBE",
    description:
      "Retrouvez nos articles et guides pratiques pour vos projets en Côte d'Ivoire.",
  },
}

export type ArticleListItem = {
  id: string
  slug: string
  titre: string
  resume: string | null
  image_couverture: string | null
  auteur: string | null
  date_publication: string | null
  categories_article: { nom: string } | null
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, titre, resume, image_couverture, auteur, date_publication, categories_article(nom)")
    .eq("publie", true)
    .order("date_publication", { ascending: false })

  return <BlogPageClient articles={(articles ?? []) as ArticleListItem[]} />
}
