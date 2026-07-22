import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui"
import { CloseIcon } from "@/components/icons"

export const metadata: Metadata = {
  title: "Paiement non abouti",
  description: "Le paiement de votre réservation GROUP PHOEBE a été annulé ou a échoué.",
  openGraph: {
    title: "Paiement non abouti",
    description: "Le paiement de votre réservation GROUP PHOEBE a été annulé ou a échoué.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paiement non abouti",
    description: "Le paiement de votre réservation GROUP PHOEBE a été annulé ou a échoué.",
  },
}

export default function EchecPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[rgba(220,38,38,0.15)] blur-xl" />
          <CloseIcon size={64} className="relative text-[#EF4444]" />
        </div>
      </div>
      <h1 className="mb-3 text-4xl font-bold text-public-text">Paiement non abouti</h1>
      <p className="mb-8 max-w-sm text-public-text-muted leading-relaxed">
        Le paiement a été annulé ou a échoué. Les disponibilités ont été
        libérées — vous pouvez réessayer à tout moment.
      </p>
      <Link href="/panier/paiement">
        <Button variant="default">Réessayer</Button>
      </Link>
    </main>
  )
}
