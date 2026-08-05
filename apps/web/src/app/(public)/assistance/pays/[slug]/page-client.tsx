"use client"

import { useT } from "@/lib/langue-context"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useActionState, useMemo, useRef, useEffect, useState } from "react"
import { Badge, Button } from "@/components/ui"
import { BackLink } from "@/components/public/back-link"
import { CheckIcon } from "@/components/icons"
import { creerDossierVoyage, type AssistanceState } from "@/app/actions/assistance"
import {
  getPays,
  prixLabel,
  TYPE_DOCUMENT_LABELS,
  MENTION_VISA_NON_GARANTI,
  type TarifsAssistance,
  type Prestation,
} from "@/lib/assistance"
import { remplir } from "@/lib/i18n/format"

function StepCard({ num, title, desc, index }: { num: string; title: string; desc?: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`flex gap-4 transition-all duration-700 ${
        inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-500 ${
          inView ? "bg-accent-blue shadow-lg shadow-accent-blue/30 scale-100" : "bg-accent-blue/50 scale-90"
        }`}
      >
        {num}
      </div>
      <div>
        <h3 className="text-base font-semibold text-public-text">{title}</h3>
        {desc && <p className="text-sm text-public-text-muted">{desc}</p>}
      </div>
    </div>
  )
}

function VisaCard({
  prestation, paysSlug,
}: {
  prestation: Prestation
  paysSlug: string
}) {
  const t = useT()
  const [state, formAction, pending] = useActionState<AssistanceState, FormData>(creerDossierVoyage, {})

  return (
    <div className={`relative rounded-2xl border p-6 transition-all ${prestation.recommended ? "border-accent-gold bg-accent-gold/5" : "border-public-border bg-public-bg-card"}`}>
      {prestation.recommended && (
        <Badge variant="gold" className="absolute -top-2.5 right-4">{t.assistancePays.recommande}</Badge>
      )}
      <h3 className="text-base font-semibold text-public-text">{prestation.name}</h3>
      <p className="mt-1 text-3xl font-bold text-accent-blue-on-dark">{prixLabel(prestation.prix)}</p>
      {/* Le dossier ne se règle plus en ligne : le montant annoncé ici est un
          ordre de grandeur, arrêté au rendez-vous. Le taire laisserait croire
          à un prix ferme. */}
      {prestation.prix !== null && (
        <p className="mt-0.5 text-xs text-public-text-faint">{t.assistance.titreIndicatif}</p>
      )}
      {prestation.description && (
        <p className="mt-3 text-sm text-public-text-muted">{prestation.description}</p>
      )}

      {/* Les pièces exigées, avant de postuler et non après : c'est ce que le
          candidat vient vérifier, et elles ne sont pas les mêmes d'un niveau à
          l'autre. */}
      {prestation.pieces.length > 0 && (
        <div className="mt-4 rounded-xl border border-public-border bg-public-bg p-3">
          <p className="text-xs font-semibold text-public-text">
            {remplir(t.assistance.piecesAFournir, { n: prestation.pieces.length })}
          </p>
          <ul className="mt-2 space-y-1">
            {prestation.pieces.map((piece) => (
              <li key={piece} className="flex items-start gap-2 text-xs text-public-text-muted">
                <span aria-hidden="true" className="mt-0.5 text-accent-green">✓</span>
                {TYPE_DOCUMENT_LABELS[piece]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-error">{state.error}</p>
      )}
      <form action={formAction}>
        <input type="hidden" name="pays_slug" value={paysSlug} />
        <input type="hidden" name="prestation" value={prestation.key} />
        <Button
          type="submit"
          variant={prestation.recommended ? "blue" : "ghost"}
          size="sm"
          disabled={pending}
          className={`mt-4 w-full ${prestation.recommended ? "" : "border-accent-blue/60 text-accent-blue-on-dark hover:bg-accent-blue/10"}`}
        >
          {pending ? "Envoi..." : "Postuler"}
        </Button>
      </form>
    </div>
  )
}

export default function CountryDetail({ tarifs }: { tarifs: TarifsAssistance }) {
  const t = useT()
  const params = useParams()
  const slug = params.slug as string

  // Prix issus de la base (éditables en /admin/tarifs).
  const pays = useMemo(() => getPays(slug, tarifs), [slug, tarifs])

  if (!pays) {
    return (
      <div className="px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-public-text">{t.assistancePays.destinationIndisponible}</h1>
        <p className="mt-3 text-sm text-public-text-muted">{t.assistancePays.pasEncoreProposee}</p>
        <Link href="/assistance" className="mt-6 inline-block text-sm font-semibold text-accent-blue-on-dark hover:underline">
          Retour à l&apos;assistance
        </Link>
      </div>
    )
  }

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-3 px-6 pt-6 text-sm text-public-text-faint">
        <BackLink href="/assistance" label={t.assistance.retourAssistance} />
        <span aria-hidden="true">·</span>
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="transition-colors hover:text-accent-blue-on-dark">{t.nav.accueil}</Link></li>
          <li aria-hidden="true">›</li>
          <li><Link href="/assistance" className="transition-colors hover:text-accent-blue-on-dark">{t.nav.assistance}</Link></li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-public-text-muted">{pays.name}</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative mx-6 mt-6 flex min-h-[240px] flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-6 py-10 text-center md:min-h-[280px]">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/40 via-accent-blue/20 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.3),transparent_60%)]" />
        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-4">
          <span role="img" aria-label={`Drapeau — ${pays.name}`} className="text-6xl md:text-7xl">
            {pays.flag}
          </span>
          <h1 className="text-4xl font-bold text-white md:text-5xl">{pays.name}</h1>
          <p className="text-base text-white/85">{pays.resume}</p>
        </div>
      </section>

      <div className="grid gap-12 px-6 py-10 lg:grid-cols-5">
        {/* Colonne gauche : procédure, bourses, calendrier, process */}
        <div className="lg:col-span-3">
          {pays.procedure && (
            <section>
              <h2 className="text-3xl font-semibold text-public-text">{t.assistancePays.procedure}</h2>
              <div className="mt-6 space-y-6">
                {pays.procedure.map((etape, i) => (
                  <StepCard key={etape.titre} num={String(i + 1)} title={etape.titre} desc={etape.detail} index={i} />
                ))}
              </div>
            </section>
          )}

          {pays.bourses && (
            <section className="mt-12">
              <h2 className="text-3xl font-semibold text-public-text">{t.assistancePays.lesBourses}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {pays.bourses.map((b) => (
                  <div key={b.code} className="rounded-2xl border border-public-border bg-public-bg-card p-5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue/15 text-sm font-bold text-accent-blue-on-dark">{b.code}</span>
                      <h3 className="text-base font-semibold text-public-text">{b.nom}</h3>
                    </div>
                    <p className="mt-3 flex items-start gap-2 text-sm text-public-text">
                      <CheckIcon size={16} className="mt-0.5 shrink-0 text-accent-green" />
                      {b.inclus}
                    </p>
                    {b.note && <p className="mt-2 text-xs text-public-text-muted">{b.note}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(pays.rentrees || pays.depots) && (
            <section className="mt-8 rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-5">
              <h3 className="text-sm font-semibold text-public-text">{t.assistancePays.calendrier}</h3>
              {pays.rentrees && <p className="mt-2 text-sm text-public-text-muted">{pays.rentrees}</p>}
              {pays.depots && <p className="mt-1 text-sm text-public-text-muted">{pays.depots}</p>}
            </section>
          )}

          <section className="mt-12">
            <h2 className="text-3xl font-semibold text-public-text">{t.assistancePays.commentCaSePasse}</h2>
            <div className="mt-6 space-y-6">
              {[
                { title: "Soumettez votre demande", desc: "Choisissez une prestation et envoyez votre demande en ligne, sans engagement." },
                { title: "Notre équipe vous contacte", desc: "Nous étudions votre dossier et convenons des modalités et du règlement." },
                { title: "Suivi du dossier", desc: "Nous assurons le suivi de votre dossier jusqu'à l'obtention du visa." },
              ].map((s, i) => (
                <StepCard key={s.title} num={String(i + 1)} title={s.title} desc={s.desc} index={i} />
              ))}
            </div>
          </section>
        </div>

        {/* Colonne droite : prestations */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-semibold text-public-text">{t.assistancePays.nosPrestations}</h2>
          <p className="mt-1 text-sm text-public-text-muted">{t.assistancePays.sansEngagement}</p>
          <div className="mt-6 space-y-4">
            {pays.prestations.map((prestation) => (
              <VisaCard key={prestation.key} prestation={prestation} paysSlug={pays.slug} />
            ))}
          </div>

          {/* Placé sous les prestations, là où le client s'apprête à postuler :
              plus bas il ne le lirait pas, plus haut il l'aurait oublié. */}
          <p className="mt-6 rounded-xl border border-accent-blue/25 bg-accent-blue/5 p-4 text-xs leading-relaxed text-public-text-muted">
            <strong className="text-public-text">{t.assistance.ceQueCouvre}</strong>{" "}
            {MENTION_VISA_NON_GARANTI}
          </p>
        </div>
      </div>
    </>
  )
}
