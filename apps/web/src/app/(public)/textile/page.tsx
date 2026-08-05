import type { Metadata } from "next"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { BackLink } from "@/components/public/back-link"
import { PageHero, SectionHead } from "@/components/public/section-head"
import { ScrollReveal } from "@/components/effects"
import { typesPagneActifs } from "@/app/actions/textile"
import { DemandeTextileForm } from "./demande-form"

export const metadata: Metadata = {
  title: "Textile — Pagnes Uniwax et Hollandais",
  description:
    "Pagnes Uniwax (Print, Block, Tabs) et wax hollandais. Dites-nous ce que vous cherchez, nous vous envoyons un devis.",
}

export default async function TextilePage() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const isLoggedIn = !!claimsData?.claims

  const types = await typesPagneActifs()

  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label="Retour à l'accueil" />
      </div>

      <PageHero
        eyebrow="Textile"
        title="Le pagne qu'il vous faut"
        lede="Uniwax et wax hollandais. Dites-nous ce que vous cherchez — nous consultons nos fournisseurs et vous répondons avec un prix ferme."
        aside={
          <Image
            src="/logos/textile.png"
            alt="Textile"
            width={478}
            height={473}
            sizes="(min-width: 640px) 208px, 160px"
            className="h-44 w-auto rounded-2xl bg-logo-plate-fixe object-contain p-3 animate-service-logo sm:h-56"
            priority
          />
        }
      />

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title="Ce que nous proposons"
            lede="Les gammes que nous sourçons auprès de nos fournisseurs."
            className="border-b-0 pb-0"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {types.map((t) => (
              <ScrollReveal key={t.cle} variant="fade-up">
                <div className="h-full rounded-2xl border border-public-border bg-public-bg-card p-5">
                  <p className="text-[11px] uppercase tracking-wider text-public-text-faint">
                    {t.marque}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-public-text">
                    {t.gamme}
                  </h3>
                  {t.description && (
                    <p className="mt-2 text-sm text-public-text-muted">{t.description}</p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-accent-gold">Sur devis</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {types.length === 0 && (
            <p className="mt-8 text-sm text-public-text-muted">
              Le catalogue est en cours de constitution. Contactez-nous en attendant.
            </p>
          )}
        </div>
      </section>

      <section id="devis" className="border-t border-public-border bg-public-bg-card px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <SectionHead
            title="Demander un devis"
            lede="Aucun engagement : nous vous répondons avec un prix, vous décidez ensuite."
            className="border-b-0 pb-0"
          />
          <div className="mt-10">
            <DemandeTextileForm isLoggedIn={isLoggedIn} types={types} />
          </div>
        </div>
      </section>
    </>
  )
}

export const dynamic = "force-dynamic"
