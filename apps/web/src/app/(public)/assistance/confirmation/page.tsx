import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui"
import { CheckIcon } from "@/components/icons"

export const metadata: Metadata = {
  title: "Dossier soumis — Assistance",
  description: "Votre demande d'assistance visa a bien été enregistrée.",
}

export default async function ConfirmationAssistance({
  searchParams,
}: {
  searchParams: Promise<{ pays?: string }>
}) {
  const { pays } = await searchParams

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent-green/20 blur-xl" />
          <CheckIcon size={64} className="relative text-accent-green" />
        </div>
      </div>
      <h1 className="mb-3 text-4xl font-bold text-public-text">Dossier soumis</h1>
      <p className="mb-8 max-w-sm leading-relaxed text-public-text-muted">
        Votre demande{pays ? ` pour un visa ${pays}` : ""} a bien été enregistrée. Notre équipe
        étudie votre dossier et vous contactera prochainement pour convenir des modalités et du paiement.
      </p>
      <div className="flex gap-4">
        <Link href="/assistance">
          <Button variant="ghost">Autres destinations</Button>
        </Link>
        <Link href="/compte/reservations">
          <Button variant="default">Mes dossiers</Button>
        </Link>
      </div>
    </main>
  )
}
