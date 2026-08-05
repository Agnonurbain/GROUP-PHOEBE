import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui"
import { CloseIcon } from "@/components/icons"
import { getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  const titre = t.etats.paiementEchoueTitre
  const description = t.etats.paiementEchoueMeta
  return {
    title: titre,
    description,
    openGraph: { title: titre, description },
    twitter: { card: "summary_large_image", title: titre, description },
  }
}

export default async function EchecPage() {
  const t = await getT()

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[rgba(220,38,38,0.15)] blur-xl" />
          <CloseIcon size={64} className="relative text-[#EF4444]" />
        </div>
      </div>
      <h1 className="mb-3 text-4xl font-bold text-public-text">{t.etats.paiementEchoueTitre}</h1>
      <p className="mb-8 max-w-sm text-public-text-muted leading-relaxed">
        {t.etats.paiementEchoueTexte}
      </p>
      <Link href="/panier/paiement">
        <Button variant="default">{t.etats.reessayer}</Button>
      </Link>
    </main>
  )
}
