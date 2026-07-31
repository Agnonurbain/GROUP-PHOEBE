"use client"

import type { AvisPublic } from "@/lib/avis"
import { libelleReference } from "@/lib/avis"
import { Card, CardContent } from "@/components/ui"
import { Badge } from "@/components/ui"
import { ScrollReveal, StaggerContainer } from "@/components/effects"

function Stars({ note }: { note: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= note ? "text-accent-gold" : "text-public-text-faint/30"}
        >
          {star <= note ? "★" : "☆"}
        </span>
      ))}
    </span>
  )
}

function anonymize(nom: string | null): string {
  if (!nom) return "Client"
  return `Client ${nom.charAt(0).toUpperCase()}***`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function AvisPageClient({ avis }: { avis: AvisPublic[] }) {
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
              Ce que nos clients disent
            </h1>
            <p className="mt-5 max-w-xl text-lg text-public-text-muted">
              Des retours authentiques de nos clients sur nos services de transport, immobilier, assistance et livraison.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          {avis.length === 0 ? (
            <p className="text-center text-sm text-public-text-muted">
              Aucun avis pour le moment.
            </p>
          ) : (
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {avis.map((a) => (
                <ScrollReveal key={a.id} variant="fade-up">
                  <Card size="sm" className="flex h-full flex-col">
                    <CardContent className="flex flex-1 flex-col gap-3 pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <Stars note={a.note} />
                        <Badge variant="gold">
                          {libelleReference(a.reference_table)}
                        </Badge>
                      </div>
                      {a.titre && (
                        <h3 className="font-heading text-sm font-semibold text-public-text">
                          {a.titre}
                        </h3>
                      )}
                      {a.commentaire && (
                        <p className="flex-1 text-sm leading-relaxed text-public-text-muted">
                          {a.commentaire}
                        </p>
                      )}
                      {a.reponse_admin && (
                        <div className="rounded-lg border border-accent-gold/15 bg-accent-gold/5 p-3">
                          <p className="text-xs font-medium text-accent-gold">
                            Réponse de GROUP PHOEBE
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-public-text-muted">
                            {a.reponse_admin}
                          </p>
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between border-t border-public-border pt-3 text-xs text-public-text-faint">
                        <span>{anonymize(a.client_nom)}</span>
                        <time dateTime={a.created_at}>
                          {formatDate(a.created_at)}
                        </time>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </>
  )
}
