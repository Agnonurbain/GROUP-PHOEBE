import Link from "next/link"
import { getT } from "@/lib/i18n/server"

export default async function PublicNotFound() {
  const t = await getT()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl font-bold text-accent-gold">404</span>
      <h1 className="mt-4 text-4xl font-bold text-public-text">{t.etats.introuvableTitre}</h1>
      <p className="mt-2 text-sm text-public-text-muted">{t.etats.introuvableTexte}</p>
      <Link href="/" className="mt-8 rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover transition-colors">
        {t.commun.retourAccueil}
      </Link>
    </div>
  )
}
