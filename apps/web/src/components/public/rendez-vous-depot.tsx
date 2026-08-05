"use client"

import { useActionState, useState } from "react"
import { reserverCreneau, annulerRendezVous, type AssistanceState } from "@/app/actions/assistance"
import { libelleCreneau } from "@/lib/rendez-vous"
import { useT } from "@/lib/langue-context"

export type CreneauClient = { debut: string; fin: string; restant: number }

/** « jeudi 13 août » — l'en-tête d'un onglet de jour. */
function libelleJour(jour: string): string {
  return new Date(`${jour}T12:00:00.000Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
}

/**
 * Prise de rendez-vous pour le dépôt d'un dossier.
 *
 * « Il choisit la date et puis il prend le rendez-vous de dépôt de dossier. »
 * C'est ce qui remplace le règlement en ligne : le parcours s'arrête sur une
 * date convenue.
 *
 * Replié par défaut — l'écran « Mes réservations » est déjà dense, et déplier
 * un agenda sur chaque dossier le noierait.
 */
export function RendezVousDepot({
  dossierId,
  jours,
  creneaux,
  existant,
}: {
  dossierId: string
  jours: string[]
  creneaux: Record<string, CreneauClient[]>
  /** Rendez-vous déjà pris pour ce dossier, s'il y en a un. */
  existant: { id: string; debut: string; fin: string } | null
}) {
  const t = useT()
  const [ouvert, setOuvert] = useState(false)
  const [jour, setJour] = useState(jours[0] ?? "")
  const [reserver, actionReserver, enCoursReserver] = useActionState<AssistanceState, FormData>(
    reserverCreneau,
    {}
  )
  const [annuler, actionAnnuler, enCoursAnnuler] = useActionState<AssistanceState, FormData>(
    annulerRendezVous,
    {}
  )

  if (existant && !annuler.success) {
    return (
      <div className="w-full max-w-sm rounded-xl border border-accent-green/30 bg-accent-green/5 p-3">
        <p className="text-[11px] font-semibold text-public-text">{t.divers.rendezVousDepot}</p>
        <p className="mt-0.5 text-xs text-public-text-muted">
          {libelleCreneau(existant.debut, existant.fin)}
        </p>
        <form action={actionAnnuler} className="mt-2">
          <input type="hidden" name="rendez_vous_id" value={existant.id} />
          <button
            type="submit"
            disabled={enCoursAnnuler}
            className="text-[11px] text-public-text-muted underline decoration-dotted transition-colors hover:text-error disabled:opacity-50"
          >
            {enCoursAnnuler ? "…" : "Annuler ce rendez-vous"}
          </button>
        </form>
        {annuler.error && (
          <p role="alert" className="mt-1 text-[11px] text-error">{annuler.error}</p>
        )}
      </div>
    )
  }

  if (reserver.success) {
    return (
      <p role="status" className="text-[11px] text-accent-green">
        {t.divers.rendezVousEnregistre}
      </p>
    )
  }

  // Aucun créneau : le dire, plutôt que de montrer un agenda vide où le client
  // chercherait ce qui n'existe pas.
  if (jours.length === 0) {
    return (
      <p className="text-[11px] text-public-text-muted">
        {t.assistance.aucunCreneauDepot}
      </p>
    )
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-xs font-medium text-accent-blue-on-dark underline decoration-dotted transition-colors hover:text-accent-blue"
      >
        {t.divers.prendreRendezVous}
      </button>
    )
  }

  return (
    <div className="w-full max-w-lg rounded-xl border border-public-border bg-public-bg p-3">
      <p className="text-[11px] font-semibold text-public-text">
        {t.divers.choisirDateHoraire}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {jours.map((j) => (
          <button
            key={j}
            type="button"
            onClick={() => setJour(j)}
            aria-pressed={jour === j}
            className={`rounded-lg border px-2 py-1 text-[11px] transition-colors ${
              jour === j
                ? "border-accent-blue bg-accent-blue/10 text-public-text"
                : "border-public-border text-public-text-muted hover:text-public-text"
            }`}
          >
            {libelleJour(j)}
          </button>
        ))}
      </div>

      <form action={actionReserver} className="mt-3">
        <input type="hidden" name="dossier_id" value={dossierId} />
        <div className="flex flex-wrap gap-1.5">
          {(creneaux[jour] ?? []).map((c) => (
            <button
              key={c.debut}
              type="submit"
              name="debut"
              value={c.debut}
              disabled={enCoursReserver}
              className="rounded-lg border border-public-border px-2.5 py-1.5 text-[11px] font-medium text-public-text transition-colors hover:border-accent-blue hover:bg-accent-blue/10 disabled:opacity-50"
            >
              {new Date(c.debut).toISOString().slice(11, 16)}
            </button>
          ))}
        </div>
        {(creneaux[jour] ?? []).length === 0 && (
          <p className="text-[11px] text-public-text-muted">
            {t.divers.plusDeCreneau}
          </p>
        )}
      </form>

      {reserver.error && (
        <p role="alert" className="mt-2 text-[11px] text-error">{reserver.error}</p>
      )}

      <button
        type="button"
        onClick={() => setOuvert(false)}
        className="mt-2 text-[11px] text-public-text-faint underline decoration-dotted"
      >
        Fermer
      </button>
    </div>
  )
}
