"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"
import { remplir } from "@/lib/i18n/format"

const champ =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
const label = "mb-1.5 block text-xs font-medium text-public-text-muted"

const TYPES_ACCEPTES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
const TAILLE_MAX = 10 * 1024 * 1024

const aujourdHui = () => new Date().toISOString().slice(0, 10)

/**
 * Dépôt de la page passeport, depuis le NAVIGATEUR.
 *
 * Passer par la server action était impossible : une pièce va jusqu'à 10 Mo et
 * un dossier jusqu'à 9 voyageurs, quand une Server Action Next plafonne à 1 Mo
 * par défaut. Le fichier monte donc directement vers le bucket et seul son
 * chemin part avec le formulaire.
 *
 * Le chemin est préfixé par l'identifiant du client : la policy de dépôt
 * (00079) et l'action refusent tout ce qui sort de ce préfixe, sans quoi un
 * chemin forgé désignerait la pièce de quelqu'un d'autre.
 */
function DeposerPasseport({
  name,
  userId,
  id,
}: {
  name: string
  userId: string
  id: string
}) {
  const t = useT()
  const [chemin, setChemin] = useState("")
  const [etat, setEtat] = useState<"vide" | "envoi" | "ok" | "erreur">("vide")
  const [message, setMessage] = useState("")

  async function envoyer(fichier: File) {
    if (!TYPES_ACCEPTES.has(fichier.type)) {
      setEtat("erreur")
      setMessage("Format accepté : JPEG, PNG, WebP ou PDF.")
      return
    }
    if (fichier.size > TAILLE_MAX) {
      setEtat("erreur")
      setMessage("Le fichier ne doit pas dépasser 10 Mo.")
      return
    }

    setEtat("envoi")
    setMessage("")
    const ext = fichier.name.split(".").pop()?.toLowerCase() || "bin"
    const cible = `billets/${userId}/${crypto.randomUUID()}.${ext}`

    const { error } = await createClient()
      .storage.from("dossiers-documents")
      .upload(cible, fichier, { contentType: fichier.type })

    if (error) {
      setEtat("erreur")
      setMessage("Envoi impossible. Réessayez, ou laissez vide : le fichier est facultatif.")
      return
    }
    setChemin(cible)
    setEtat("ok")
  }

  return (
    <div>
      {/* Ce que lit le serveur : le chemin, jamais le fichier. */}
      <input type="hidden" name={name} value={chemin} />
      <label htmlFor={id} className={label}>
        {t.assistance.pagePasseport} <span className="text-public-text-faint">(facultatif)</span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void envoyer(f)
        }}
        className="w-full text-xs text-public-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-blue/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-accent-blue-on-dark"
      />
      {etat === "envoi" && <p className="mt-1 text-[11px] text-public-text-muted">Envoi…</p>}
      {etat === "ok" && (
        <p role="status" className="mt-1 text-[11px] text-accent-green">
          Document joint.
        </p>
      )}
      {etat === "erreur" && (
        <p role="alert" className="mt-1 text-[11px] text-error">
          {message}
        </p>
      )}
    </div>
  )
}

/**
 * Passeport d'un accompagnant : les mêmes informations que le voyageur
 * principal, comme l'exige la compagnie pour émettre chaque billet.
 *
 * Les bébés de moins de deux ans n'ont pas de bloc : ils voyagent sur les
 * genoux d'un adulte et leur document se régularise avant l'émission.
 */
export function PasseportAccompagnant({
  index,
  type,
  userId,
  moisValidite,
}: {
  index: number
  type: "adulte" | "enfant"
  userId: string
  moisValidite: number
}) {
  const t = useT()
  const n = index + 2 // le voyageur 1 est le titulaire de la demande
  return (
    <div className="rounded-xl border border-public-border bg-public-bg p-4">
      <input type="hidden" name={`passager_type_${index}`} value={type} />
      <p className="text-xs font-semibold text-public-text">
        Voyageur {n} — {type === "enfant" ? "enfant" : "adulte"}
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor={`passager_nom_${index}`} className={label}>{t.assistance.nomPrenoms}<Obligatoire /></label>
          <input
            id={`passager_nom_${index}`}
            name={`passager_nom_${index}`}
            required
            placeholder="Tels qu'inscrits"
            className={champ}
          />
        </div>
        <div>
          <label htmlFor={`passager_passeport_numero_${index}`} className={label}>{t.assistance.numeroPasseport}<Obligatoire /></label>
          <input
            id={`passager_passeport_numero_${index}`}
            name={`passager_passeport_numero_${index}`}
            required
            placeholder="Ex. 21AB45678"
            className={champ}
          />
        </div>
        <div>
          <label htmlFor={`passager_passeport_expiration_${index}`} className={label}>Date d&apos;expiration<Obligatoire /></label>
          <input
            id={`passager_passeport_expiration_${index}`}
            name={`passager_passeport_expiration_${index}`}
            type="date"
            required
            min={aujourdHui()}
            className={`${champ} [color-scheme:dark]`}
          />
        </div>
      </div>
      <div className="mt-3">
        <DeposerPasseport
          name={`passager_passeport_fichier_${index}`}
          userId={userId}
          id={`passager_passeport_fichier_input_${index}`}
        />
      </div>
      {moisValidite > 0 && (
        <p className="mt-2 text-[11px] text-public-text-faint">
          {remplir(t.assistance.validiteCePasseport, { mois: moisValidite })}
        </p>
      )}
    </div>
  )
}

export { DeposerPasseport }
