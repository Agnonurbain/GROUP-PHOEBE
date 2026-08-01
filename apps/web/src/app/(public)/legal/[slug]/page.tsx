import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ContenuFrancais } from "@/components/public/contenu-francais"
import { BackLink } from "@/components/public/back-link"
import { getPageLegale, pageIncomplete, SLUGS_LEGAUX } from "@/lib/legal"

export function generateStaticParams() {
  return SLUGS_LEGAUX.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageLegale(slug)
  if (!page) return {}

  return {
    title: page.titre,
    description: page.chapeau,
    // Un brouillon n'a rien à faire dans un index de recherche : il serait cité
    // comme l'engagement de l'entreprise alors qu'il attend une validation.
    robots: page.publie ? undefined : { index: false, follow: false },
  }
}

export default async function PageLegaleRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPageLegale(slug)
  if (!page) notFound()

  const incomplete = pageIncomplete(page)

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <h1 className="text-4xl font-bold text-public-text">{page.titre}</h1>
      {page.chapeau && (
        <p className="mt-2 text-sm text-public-text-muted">{page.chapeau}</p>
      )}
      <p className="mt-1 text-xs text-public-text-faint">
        Dernière mise à jour :{" "}
        {new Date(page.updated_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>

      {!page.publie && (
        <div
          role="note"
          className="mt-6 rounded-xl border border-accent-gold/40 bg-accent-gold/5 px-5 py-4"
        >
          <p className="text-sm font-semibold text-accent-gold">Document provisoire</p>
          <p className="mt-1 text-xs text-public-text-muted">
            {incomplete ? (
              <>
                Les passages marqués <span className="font-mono">[À COMPLÉTER]</span>{" "}
                attendent des informations que seule l&apos;entreprise détient.{" "}
              </>
            ) : null}
            Ce texte n&apos;engage pas encore GROUP PHOEBE et doit être validé avant
            publication.
          </p>
        </div>
      )}

        <ContenuFrancais />

      <div className="mt-10 space-y-8">
        {page.sections.map((section) => (
          <section key={section.titre}>
            <h2 className="text-lg font-semibold text-public-text">{section.titre}</h2>
            <div className="mt-2 space-y-2">
              {section.paragraphes.map((p, i) => (
                <p
                  key={i}
                  className={`text-sm leading-relaxed text-public-text-muted ${
                    p.includes("[À COMPLÉTER") ? "italic" : ""
                  }`}
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
