import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { BackLink } from "@/components/public/back-link"
import { getT } from "@/lib/i18n/server"

export const metadata: Metadata = {
  title: "Demande envoyée — Textile",
  // La page n'a rien à indexer : elle ne se voit qu'après un envoi.
  robots: { index: false, follow: false },
}

export default async function ConfirmationTextile() {
  const t = await getT()
  return (
    <>
      <div className="px-6 pt-6 sm:px-10">
        <BackLink href="/textile" label={t.textile.retourTextile} />
      </div>

      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-xl text-center">
          <CheckCircle2 size={40} className="mx-auto text-accent-green" aria-hidden="true" />
          <h1 className="font-display mt-5 text-3xl font-medium text-public-text">
            {t.textile.demandePartie}
          </h1>
          <p className="mt-4 text-sm text-public-text-muted">
            Nous consultons nos fournisseurs et revenons vers vous avec un prix
            ferme. Vous le retrouverez dans « Mes réservations », et vous serez
            prévenu dès qu&apos;il est prêt.
          </p>
          <p className="mt-3 text-xs text-public-text-faint">
            Un devis n&apos;engage à rien : vous décidez après l&apos;avoir vu.
          </p>
          <Link
            href="/compte/reservations"
            className="mt-8 inline-block rounded-xl bg-accent-gold px-5 py-3 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-accent-gold-hover"
          >
            Voir mes demandes
          </Link>
        </div>
      </section>
    </>
  )
}
