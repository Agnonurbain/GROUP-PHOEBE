import Link from "next/link"
import { getT } from "@/lib/i18n/server"

/**
 * Le 404 global — celui qu'un visiteur voit sur une URL inconnue.
 *
 * Il en existe un second sous `(public)`, pour les `notFound()` déclenchés
 * dans une route. Les deux disaient la même chose en des termes différents ;
 * ils partagent désormais les mêmes clés, sans quoi la traduction de l'un
 * aurait laissé l'autre en français.
 */
export default async function NotFound() {
  const t = await getT()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#141312] px-4">
      <p className="text-[140px] font-bold leading-none tracking-tight text-[rgba(201,168,76,0.1)]">404</p>
      <div className="-mt-10 text-center">
        <h1 className="text-xl font-bold text-[#EDE9E3]">{t.etats.introuvableTitre}</h1>
        <p className="mt-2 text-sm text-public-text-muted">{t.etats.introuvableTexte}</p>
      </div>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0A0A0A] transition-all hover:bg-[#B8943A]"
      >
        {t.commun.retourAccueil}
      </Link>
    </div>
  )
}
