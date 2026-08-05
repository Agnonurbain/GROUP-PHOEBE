import { metadonnees } from "@/lib/i18n/metadonnees"
import { createClient } from "@/lib/supabase/server"
import { BlogPageClient } from "./page-client"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.blogTitre,
    description: t.meta.blogDescription,
  }))

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
