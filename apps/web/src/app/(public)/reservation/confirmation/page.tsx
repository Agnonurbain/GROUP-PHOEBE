import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PanierStepper } from "@/components/panier-stepper"
import { Button } from "@/components/ui"
import { CheckIcon } from "@/components/icons"
import ConfirmationClient from "./confirmation-client"
import { getT } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  const titre = `${t.etats.paiementEnregistreTitre} — Confirmation`
  const description = t.etats.paiementEnregistreMeta
  return {
    title: titre,
    description,
    openGraph: { title: titre, description },
    twitter: { card: "summary_large_image", title: titre, description },
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ demande?: string }>;
}) {
  const { demande: demandeId } = await searchParams
  const t = await getT()

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
        <h1 className="mb-3 text-4xl font-bold text-public-text">{t.etats.paiementEnregistreTitre}</h1>
        <p className="mb-8 max-w-sm text-public-text-muted leading-relaxed">
          {vehiculeLabel
            ? t.etats.reservationEnAttenteVehicule.replace("{vehicule}", vehiculeLabel)
            : t.etats.reservationEnAttente}
        </p>
        <div className="flex gap-4">
          <Link href="/transport/catalogue">
            <Button variant="ghost">{t.etats.retourCatalogue}</Button>
          </Link>
          <Link href="/compte/reservations">
            <Button variant="default">{t.etats.voirMesReservations}</Button>
          </Link>
        </div>
      </main>
    </>
  )
}