import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PanierStepper } from "@/components/panier-stepper"
import { Button } from "@/components/ui"
import { CheckIcon } from "@/components/icons"
import ConfirmationClient from "./confirmation-client"

export const metadata: Metadata = {
  title: "Paiement enregistré — Confirmation",
  description: "Votre réservation GROUP PHOEBE a été enregistrée avec succès.",
  openGraph: {
    title: "Paiement enregistré — Confirmation",
    description: "Votre réservation GROUP PHOEBE a été enregistrée avec succès.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paiement enregistré — Confirmation",
    description: "Votre réservation GROUP PHOEBE a été enregistrée avec succès.",
  },
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ demande?: string }>;
}) {
  const { demande: demandeId } = await searchParams

  let vehiculeLabel = ""

  if (demandeId) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("demandes_transport")
      .select("vehicule_id, vehicules(marque, modele)")
      .eq("id", demandeId)
      .single()

    if (data?.vehicules) {
      const v = data.vehicules as { marque: string; modele: string }
      vehiculeLabel = `${v.marque} ${v.modele}`
    }
  }

  return (
    <>
      <ConfirmationClient />
      <PanierStepper current={2} />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent-green/20 blur-xl" />
            <CheckIcon size={64} className="relative text-accent-green" />
          </div>
        </div>
        <h1 className="mb-3 text-4xl font-bold text-public-text">Paiement enregistré</h1>
        <p className="mb-8 max-w-sm text-public-text-muted leading-relaxed">
          Votre réservation{vehiculeLabel ? ` pour le ${vehiculeLabel}` : ""}{" "}
          est en attente de validation par notre équipe. Vous recevrez une
          notification dès qu&apos;elle sera confirmée.
        </p>
        <div className="flex gap-4">
          <Link href="/transport/catalogue">
            <Button variant="ghost">Retour au catalogue</Button>
          </Link>
          <Link href="/compte/reservations">
            <Button variant="default">Voir mes réservations</Button>
          </Link>
        </div>
      </main>
    </>
  )
}