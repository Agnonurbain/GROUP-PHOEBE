"use client"

import Link from "next/link"
import Image from "next/image"
import { ScrollReveal, StaggerContainer } from "@/components/effects"
import { Badge } from "@/components/ui"
import type { ArticleListItem } from "./page"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function ArticleCard({ article, index }: { article: ArticleListItem; index: number }) {
  return (
    <ScrollReveal variant="fade-up" delay={index * 0.05}>
      <Link
        href={`/blog/${article.slug}`}
        className="group/card flex flex-col overflow-hidden rounded-xl border border-public-border bg-public-bg-card ring-1 ring-foreground/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-public-bg-elevated hover:shadow-xl hover:shadow-black/20"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-public-bg-elevated">
          {article.image_couverture ? (
            <Image
              src={article.image_couverture}
              alt={article.titre}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl text-public-text-faint/30">📰</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          {article.categories_article?.nom && (
            <Badge variant="gold" className="w-fit">
              {article.categories_article.nom}
            </Badge>
          )}
          <h3 className="font-heading text-base font-semibold leading-snug text-public-text transition-colors group-hover/card:text-accent-gold">
            {article.titre}
          </h3>
          {article.resume && (
            <p className="flex-1 text-sm leading-relaxed text-public-text-muted line-clamp-3">
              {article.resume}
            </p>
          )}
          <div className="flex items-center gap-3 border-t border-public-border pt-3 text-xs text-public-text-faint">
            {article.auteur && <span>{article.auteur}</span>}
            <time dateTime={article.date_publication ?? undefined}>
              {formatDate(article.date_publication)}
            </time>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  )
}

export function BlogPageClient({ articles }: { articles: ArticleListItem[] }) {
  return (
    <>
      <section className="border-b border-public-border px-6 py-16 sm:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal variant="fade-up">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-accent-gold">
              <span aria-hidden="true" className="h-px w-8 bg-accent-gold" />
              GROUP PHOEBE
            </p>
            <h1 className="font-display mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-tight text-public-text sm:text-5xl md:text-6xl">
              Blog & Guides
            </h1>
            <p className="mt-5 max-w-xl text-lg text-public-text-muted">
              Conseils pratiques, guides et actualités pour vous accompagner dans vos projets de transport, immobilier, assistance et livraison.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          {articles.length === 0 ? (
            <p className="text-center text-sm text-public-text-muted">
              Aucun article pour le moment.
            </p>
          ) : (
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <ArticleCard key={a.id} article={a} index={i} />
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </>
  )
}
