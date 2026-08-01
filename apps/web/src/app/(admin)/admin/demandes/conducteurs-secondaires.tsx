"use client"

import { useActionState, useState, useTransition } from "react"
import {
  verifierConducteurSecondaire,
  permisConducteurSecondaire,
  type DemandeActionState,
} from "@/app/actions/demandes"

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  documents_soumis: { label: "À vérifier", color: "bg-phoebe-gold/10 text-phoebe-gold-dark" },
  verifie: { label: "Vérifié", color: "bg-phoebe-green/10 text-phoebe-green-deep" },
  rejete: { label: "Rejeté", color: "bg-error/10 text-error" },
}

export type Conducteur = {
  id: string
  nom: string
  statut_verification: string
}

/**
 * Conducteurs secondaires d'une location.
 *
 * Ils étaient saisis à la réservation puis jamais relus : le jour du retrait,
 * l'agent ignorait qui d'autre avait le droit de conduire, et le permis déposé
 * ne servait à rien.
 */
export function ConducteursSecondaires({ conducteurs }: { conducteurs: Conducteur[] }) {
  if (conducteurs.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-phoebe-pearl bg-phoebe-pearl/20 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-phoebe-anthracite/70">
        Conducteurs secondaires
      </p>
      <ul className="mt-2 space-y-2">
        {conducteurs.map((c) => (
          <li key={c.id}>
            <LigneConducteur conducteur={c} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function LigneConducteur({ conducteur }: { conducteur: Conducteur }) {
  const [state, action, enCours] = useActionState<DemandeActionState, FormData>(
    verifierConducteurSecondaire,
    {}
  )
  const [pending, startTransition] = useTransition()
  const [erreurPermis, setErreurPermis] = useState<string | null>(null)

  const statut = STATUT_LABELS[conducteur.statut_verification] ?? {
    label: conducteur.statut_verification,
    color: "bg-phoebe-pearl text-phoebe-anthracite",
  }
  const aDecider = conducteur.statut_verification === "documents_soumis" && !state.success

  // Le bucket est privé : l'URL est signée au clic, jamais au rendu.
  function ouvrirPermis() {
    setErreurPermis(null)
    startTransition(async () => {
      const res = await permisConducteurSecondaire(conducteur.id)
      if (res.error || !res.url) {
        setErreurPermis(res.error ?? "Permis indisponible.")
        return
      }
      window.open(res.url, "_blank", "noopener,noreferrer")
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium text-phoebe-anthracite">{conducteur.nom}</span>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statut.color}`}>
        {state.success ? "Traité" : statut.label}
      </span>

      <button
        type="button"
        onClick={ouvrirPermis}
        disabled={pending}
        className="text-xs text-phoebe-green hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Voir le permis"}
      </button>

      {aDecider && (
        <span className="flex gap-1">
          <form action={action}>
            <input type="hidden" name="conducteur_id" value={conducteur.id} />
            <input type="hidden" name="decision" value="verifie" />
            <button
              type="submit"
              disabled={enCours}
              className="rounded-lg bg-phoebe-green px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Valider
            </button>
          </form>
          <form action={action}>
            <input type="hidden" name="conducteur_id" value={conducteur.id} />
            <input type="hidden" name="decision" value="rejete" />
            <button
              type="submit"
              disabled={enCours}
              className="rounded-lg border border-error/40 px-2.5 py-1 text-[11px] font-semibold text-error disabled:opacity-50"
            >
              Rejeter
            </button>
          </form>
        </span>
      )}

      {(state.error || erreurPermis) && (
        <span role="alert" className="text-[11px] text-error">
          {state.error ?? erreurPermis}
        </span>
      )}
    </div>
  )
}
