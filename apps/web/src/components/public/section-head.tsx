/* Hallmark · primitives du système — voir design.md (§ Rythme des têtes de section).
   Ces composants encodent le rythme verrouillé : eyebrow + display + lede,
   alignés à gauche. Les pages services doivent les utiliser plutôt que de
   réinventer un titre à chaque section. */

import type { ReactNode } from "react"

/** Filet + libellé en petites capitales espacées, à la couleur de la verticale. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-[var(--color-vertical,#C9A84C)] ${className}`}>
      <span aria-hidden="true" className="h-px w-8 bg-[var(--color-vertical,#C9A84C)]" />
      {children}
    </p>
  )
}

/** Hero de page service : biaisé à gauche, hauteur suivant le contenu. */
export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  aside,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lede?: ReactNode
  actions?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="border-b border-public-border px-6 py-16 sm:px-10 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16">
        <div>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="font-display mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-tight text-public-text sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {lede && <p className="mt-5 max-w-xl text-lg text-public-text-muted">{lede}</p>}
          {actions && <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div>}
        </div>
        {aside && <div className="lg:justify-self-end">{aside}</div>}
      </div>
    </section>
  )
}

/** Tête de section : display + lede, alignés à gauche. Eyebrow optionnel. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  aside,
  className = "",
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lede?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-4 border-b border-public-border pb-6 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h2 className="font-display text-3xl font-medium tracking-tight text-public-text md:text-4xl">
          {title}
        </h2>
        {lede && <p className="mt-3 max-w-xl text-base text-public-text-muted">{lede}</p>}
      </div>
      {aside && <div className="shrink-0 sm:text-right">{aside}</div>}
    </div>
  )
}
