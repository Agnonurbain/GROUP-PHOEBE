import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Badge } from "@/components/ui"

type Props = {
  params: Promise<{ slug: string }>
}

type ArticleDetail = {
  id: string
  slug: string
  titre: string
  resume: string | null
  contenu: string
  image_couverture: string | null
  auteur: string | null
  date_publication: string | null
  meta_title: string | null
  meta_description: string | null
  categories_article: { nom: string } | null
}

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("articles")
    .select("id, slug, titre, resume, contenu, image_couverture, auteur, date_publication, meta_title, meta_description, categories_article(nom)")
    .eq("slug", slug)
    .eq("publie", true)
    .single()

  return data as ArticleDetail | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) return {}

  const title = article.meta_title || `${article.titre} — GROUP PHOEBE`
  const description = article.meta_description || article.resume || ""

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) notFound()

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 pt-6 text-sm text-public-text-faint sm:px-10">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-accent-gold">Accueil</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/blog" className="transition-colors hover:text-accent-gold">Blog</Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-public-text-muted">{article.titre}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-8 sm:px-10 sm:py-12">
        {article.image_couverture && (
          <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-xl">
            {/* `next/image` lèverait à l'exécution sur un hôte absent de
                remotePatterns, et le champ admin accepte une URL libre : la
                couverture d'un article casserait la page entière. On garde
                <img>, avec la priorité de chargement — c'est le LCP. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.image_couverture}
              alt={article.titre}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <header className="mb-10">
          {article.categories_article?.nom && (
            <Badge variant="gold" className="mb-4">{article.categories_article.nom}</Badge>
          )}
          <h1 className="font-display text-3xl font-medium leading-[1.08] tracking-tight text-public-text sm:text-4xl md:text-5xl">
            {article.titre}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-public-text-faint">
            {article.auteur && <span>Par {article.auteur}</span>}
            <time dateTime={article.date_publication ?? undefined}>
              {formatDate(article.date_publication)}
            </time>
          </div>
        </header>

        <div
          className="prose-content text-base leading-relaxed text-public-text-muted"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />

        <div className="mt-16 border-t border-public-border pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-gold transition-colors hover:text-accent-gold-hover"
          >
            ← Retour au blog
          </Link>
        </div>
      </article>
    </>
  )
}
