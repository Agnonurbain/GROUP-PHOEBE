import { getT } from "@/lib/i18n/server"
import { metadonnees } from "@/lib/i18n/metadonnees"
import Link from "next/link"
import { Button } from "@/components/ui"
import { CheckIcon } from "@/components/icons"
import { TYPE_DEMANDE_LABELS } from "@/lib/immobilier"
import { remplir } from "@/lib/i18n/format"

export const generateMetadata = () =>
  metadonnees((t) => ({
    titre: t.meta.immobilierConfirmationTitre,
    description: t.meta.immobilierConfirmationDescription,
    noindex: true,
  }))

export default async function ConfirmationImmobilier({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const t = await getT()
  const { type } = await searchParams
  const label = type && TYPE_DEMANDE_LABELS[type] ? TYPE_DEMANDE_LABELS[type].toLowerCase() : "demande"

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-green/20 blur-xl" />
          <CheckIcon size={64} className="relative text-accent-green" />
        </div>
      </div>
      <h1 className="mb-3 text-4xl font-bold text-public-text">{t.immobilier.demandeEnvoyee}</h1>
      <p className="mb-8 max-w-sm leading-relaxed text-public-text-muted">
        {remplir(t.immobilier.demandeEnregistree, { type: label })}
      </p>
      <div className="flex gap-4">
        <Link href="/immobilier">
          <Button variant="ghost">{t.immobilier.voirAutresBiens}</Button>
        </Link>
        <Link href="/compte/reservations">
          <Button variant="default">{t.immobilier.mesDemandes}</Button>
        </Link>
      </div>
    </main>
  )
}
