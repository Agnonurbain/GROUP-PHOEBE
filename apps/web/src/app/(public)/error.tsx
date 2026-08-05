"use client"

import Link from "next/link"
import { Button } from "@/components/ui"
import { AlertIcon } from "@/components/icons"
import { useT } from "@/lib/langue-context"

export default function PublicError({ reset }: { reset: () => void }) {
  const t = useT()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,68,68,0.1)]">
        <AlertIcon size={28} className="text-[#EF4444]" />
      </div>
      <h1 className="text-4xl font-bold text-public-text">{t.etats.erreurTitre}</h1>
      <p className="mt-2 text-sm text-public-text-muted">{t.etats.erreurTexte}</p>
      <div className="mt-8 flex gap-4">
        <Button onClick={reset}>{t.etats.reessayer}</Button>
        <Link href="/" className="rounded-lg border border-public-border px-6 py-3 text-sm font-semibold text-public-text hover:bg-public-bg-elevated transition-colors">
          {t.nav.accueil}
        </Link>
      </div>
    </div>
  )
}
