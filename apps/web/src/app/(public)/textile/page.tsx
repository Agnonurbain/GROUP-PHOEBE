import { metadonnees } from "@/lib/i18n/metadonnees"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { BackLink } from "@/components/public/back-link"
import { PageHero, SectionHead } from "@/components/public/section-head"
import { typesPagneActifs, catalogueArticles } from "@/app/actions/textile"
import { TextileClient } from "./textile-client"
import { getT } from "@/lib/i18n/server"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.textileTitre,
    description: t.meta.textileDescription,
  }))

export default async function TextilePage() {
  const t = await getT()
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const isLoggedIn = !!claimsData?.claims

  const [types, articles] = await Promise.all([
    typesPagneActifs(),
    catalogueArticles(),
  ])

  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/" label={t.commun.retourAccueil} />
      </div>

      <PageHero
        eyebrow={t.nav.textile}
        title={t.textile.lePagneQuIlVousFaut}
        lede={t.textile.heroLede}
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

      <section id="catalogue" className="scroll-mt-24 px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            title={t.textile.notreCatalogue}
            lede={t.textile.catalogueLede}
            className="border-b-0 pb-0"
          />
          <div className="mt-10">
            <TextileClient isLoggedIn={isLoggedIn} types={types} articles={articles} />
          </div>
        </div>
      </section>

    </>
  )
}

export const dynamic = "force-dynamic"
