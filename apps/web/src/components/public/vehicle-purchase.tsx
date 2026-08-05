"use client"

import { useActionState } from "react"
import { creerDemandeAchat, type AchatState } from "@/app/actions/achat"
import { Card } from "@/components/ui"
import { SubmitButton } from "@/components/submit-button"
import { AccepterCgv } from "@/components/public/accepter-cgv"

import { useT } from "@/lib/langue-context"
interface VehiclePurchaseProps {
  vehiculeId: string
  marque: string
  modele: string
  prixVente: number
}

export function VehiclePurchase({
  vehiculeId,
  marque,
  modele,
  prixVente,
}: VehiclePurchaseProps) {
  const t = useT()
  const [state, action] = useActionState<AchatState, FormData>(
    creerDemandeAchat,
    {}
  )

  return (
    <form action={action} className="lg:sticky lg:top-24">
      <input type="hidden" name="vehicule_id" value={vehiculeId} />
      <input type="hidden" name="marque" value={marque} />
      <input type="hidden" name="modele" value={modele} />

      <Card>
        <h3 className="text-base font-semibold text-public-text">{t.transport.acheterCeVehicule}</h3>

        <div className="mt-6 rounded-xl border border-accent-gold/40 bg-[rgba(201,168,76,0.08)] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-public-text">{t.transport.prixAffiche}</span>
            <span className="text-3xl font-bold text-accent-gold">
              {prixVente > 0
                ? `${prixVente.toLocaleString("fr-FR")} ${t.commun.devise}`
                : t.transport.surDemande}
            </span>
          </div>
          <p className="mt-2 text-xs text-public-text-muted">
            {t.transport.prixIndicatif}
          </p>
        </div>

        <ol className="mt-6 space-y-3 text-sm text-public-text-muted">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-xs font-bold text-accent-gold">1</span>
            Vous envoyez une demande d&apos;achat (sans engagement).
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-xs font-bold text-accent-gold">2</span>
            Notre équipe confirme le prix final et le montant de l&apos;acompte.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-gold/15 text-xs font-bold text-accent-gold">3</span>
            Vous réglez l&apos;acompte pour réserver le véhicule.
          </li>
        </ol>

        {state.error && (
          <p role="alert" className="mt-5 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {state.error}
          </p>
        )}

        <AccepterCgv id="cgv-achat" />

        <SubmitButton
          variant="default"
          className="mt-8 w-full rounded-xl bg-accent-gold px-4 py-3.5 text-sm font-semibold text-[#0A0A0A] shadow-md transition-all hover:bg-accent-gold-hover active:scale-[0.98] disabled:opacity-50"
        >
          Faire une demande d&apos;achat
        </SubmitButton>

        <p className="mt-3 text-center text-xs text-public-text-faint">
          {t.transport.connexionRequise}
        </p>
      </Card>
    </form>
  )
}
