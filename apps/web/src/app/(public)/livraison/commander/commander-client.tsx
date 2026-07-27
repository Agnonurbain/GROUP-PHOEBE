"use client"

import { useActionState, useCallback, useState } from "react"
import Link from "next/link"
import { BackLink } from "@/components/public/back-link"
import { Card } from "@/components/ui"
import { creerExpedition, type LivraisonState } from "@/app/actions/livraison"
import {
  MODES_LIVRAISON,
  MODE_LABELS,
  ZONE_LABELS,
  computeLivraisonPrix,
  deriverZoneLivraison,
  palierPoids,
  PALIERS_POIDS,
  POIDS_MAX_KG,
  type CommuneMatch,
} from "@/lib/livraison"

type Commune = { id: string; nom: string; zoneId: string | null }

const inputClass =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-orange focus:outline-none focus:ring-2 focus:ring-accent-orange/20"

const labelClass = "mb-1.5 block text-sm font-medium text-public-text"

/* Liste fermée : en saisie libre, un client pouvait déclarer une commune proche
   pour obtenir un tarif intracommunal alors que la livraison était nationale.
   « Autre localité » retombe sur le tarif national (aucune correspondance
   commune → zone nationale côté serveur), donc personne n'est bloqué. */
export const AUTRE_LOCALITE = "Autre localité"

function CommuneField({
  id,
  name,
  label,
  communes,
  text,
  setText,
}: {
  id: string
  name: string
  label: string
  communes: Commune[]
  text: string
  setText: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <select
        id={id}
        name={name}
        value={text}
        required
        onChange={(e) => setText(e.target.value)}
        className={inputClass}
      >
        <option value="">— Choisir une commune —</option>
        {communes.map((c) => (
          <option key={c.id} value={c.nom}>{c.nom}</option>
        ))}
        <option value={AUTRE_LOCALITE}>{AUTRE_LOCALITE} (tarif national)</option>
      </select>
    </div>
  )
}

export default function CommanderClient({
  defaultNom,
  defaultContact,
  communes,
}: {
  defaultNom: string
  defaultContact: string
  communes: Commune[]
}) {
  const [state, formAction, pending] = useActionState<LivraisonState, FormData>(creerExpedition, {})
  const [mode, setMode] = useState<string>(MODES_LIVRAISON[0])
  const [communeCollecte, setCommuneCollecte] = useState("")
  const [communeLivraison, setCommuneLivraison] = useState("")
  const [poids, setPoids] = useState("")

  const matchCommune = useCallback(
    (t: string): CommuneMatch => {
      const q = t.trim().toLowerCase()
      if (!q) return null
      const c = communes.find((cc) => cc.nom.toLowerCase() === q)
      return c ? { id: c.id, zoneId: c.zoneId } : null
    },
    [communes]
  )

  const adressesRenseignees = communeCollecte.trim() !== "" && communeLivraison.trim() !== ""
  const zone = deriverZoneLivraison(matchCommune(communeCollecte), matchCommune(communeLivraison))

  // Le poids fait partie du prix : tant qu'il n'est pas saisi (ou hors grille),
  // aucun montant n'est annoncé.
  const poidsNum = poids.trim() === "" ? null : Number(poids)
  const poidsValide = poidsNum !== null && Number.isFinite(poidsNum) && poidsNum > 0
  const poidsHorsGrille = poidsValide && poidsNum > POIDS_MAX_KG
  const palier = poidsValide && !poidsHorsGrille ? palierPoids(poidsNum) : null
  const prix =
    adressesRenseignees && poidsValide && !poidsHorsGrille
      ? computeLivraisonPrix(zone, mode, poidsNum)
      : null

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
      <div className="mb-6">
        <BackLink href="/livraison" label="Retour à la livraison" />
      </div>
      <h1 className="font-display text-4xl font-medium tracking-tight text-public-text">Commander une livraison</h1>
      <p className="mt-2 text-sm text-public-text-muted">
        Choisissez les communes et indiquez le poids : la zone et le prix sont calculés automatiquement.
      </p>

      {state.error && (
        <div role="alert" className="mt-6 rounded-xl border border-error/30 bg-error/5 px-5 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Expéditeur / Destinataire */}
          <Card>
            <h2 className="text-base font-semibold text-public-text">Expéditeur & destinataire</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="expediteur_nom" className={labelClass}>Votre nom *</label>
                <input id="expediteur_nom" name="expediteur_nom" required defaultValue={defaultNom} className={inputClass} />
              </div>
              <div>
                <label htmlFor="expediteur_contact" className={labelClass}>Votre contact *</label>
                <input id="expediteur_contact" name="expediteur_contact" required defaultValue={defaultContact} placeholder="+225 07 00 00 00 00" className={inputClass} />
              </div>
              <div>
                <label htmlFor="destinataire_nom" className={labelClass}>Nom du destinataire *</label>
                <input id="destinataire_nom" name="destinataire_nom" required className={inputClass} />
              </div>
              <div>
                <label htmlFor="destinataire_contact" className={labelClass}>Contact du destinataire *</label>
                <input id="destinataire_contact" name="destinataire_contact" required placeholder="+225 07 00 00 00 00" className={inputClass} />
              </div>
            </div>
          </Card>

          {/* Adresses — la zone en découle */}
          <Card>
            <h2 className="text-base font-semibold text-public-text">Adresses</h2>
            <p className="mt-1 text-xs text-public-text-muted">La zone de livraison se déduit des communes saisies.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <CommuneField id="commune_collecte" name="commune_collecte" label="Commune de collecte *" communes={communes} text={communeCollecte} setText={setCommuneCollecte} />
              <CommuneField id="commune_livraison" name="commune_livraison" label="Commune de livraison *" communes={communes} text={communeLivraison} setText={setCommuneLivraison} />
              <div>
                <label htmlFor="adresse_collecte" className={labelClass}>Adresse de collecte *</label>
                <input id="adresse_collecte" name="adresse_collecte" required placeholder="Quartier, rue, repère…" className={inputClass} />
              </div>
              <div>
                <label htmlFor="adresse_livraison" className={labelClass}>Adresse de livraison *</label>
                <input id="adresse_livraison" name="adresse_livraison" required placeholder="Quartier, rue, repère…" className={inputClass} />
              </div>
            </div>
          </Card>

          {/* Mode */}
          <Card>
            <h2 className="text-base font-semibold text-public-text">Mode de livraison</h2>
            <div className="mt-5">
              <label htmlFor="mode" className={labelClass}>Mode *</label>
              <select id="mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
                {MODES_LIVRAISON.map((m) => (
                  <option key={m} value={m}>{MODE_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Colis */}
          <Card>
            <h2 className="text-base font-semibold text-public-text">Détails du colis</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nature_colis" className={labelClass}>Nature du colis</label>
                <input id="nature_colis" name="nature_colis" placeholder="Documents, vêtements, électronique…" className={inputClass} />
              </div>
              <div>
                <label htmlFor="poids_kg" className={labelClass}>Poids (kg) *</label>
                <input
                  id="poids_kg"
                  name="poids_kg"
                  type="number"
                  inputMode="decimal"
                  min="0.1"
                  max={POIDS_MAX_KG}
                  step="0.1"
                  required
                  value={poids}
                  onChange={(e) => setPoids(e.target.value)}
                  placeholder="Ex : 2.5"
                  aria-describedby="poids-aide"
                  className={inputClass}
                />
                <p id="poids-aide" className="mt-1.5 text-xs text-public-text-faint">
                  {PALIERS_POIDS.map((p) => p.label).join(" · ")} — au-delà de {POIDS_MAX_KG} kg, sur devis.
                </p>
                {poidsHorsGrille && (
                  <p role="alert" className="mt-1.5 text-xs text-error">
                    Au-delà de {POIDS_MAX_KG} kg, contactez-nous pour un devis.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="dimensions" className={labelClass}>Dimensions</label>
                <input id="dimensions" name="dimensions" placeholder="Ex : 30 × 20 × 15 cm" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="valeur_declaree" className={labelClass}>Valeur déclarée (FCFA)</label>
                <input id="valeur_declaree" name="valeur_declaree" type="number" inputMode="numeric" min="0" placeholder="Optionnel" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="photos" className={labelClass}>Photos du colis (optionnel)</label>
                <input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm text-public-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-orange/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent-orange hover:file:bg-accent-orange/20"
                />
                <p className="mt-1 text-xs text-public-text-faint">Ajoutez une ou plusieurs photos pour faciliter la prise en charge.</p>
              </div>
            </div>
          </Card>

          {/* Paiement */}
          <Card>
            <h2 className="text-base font-semibold text-public-text">Moyen de paiement</h2>
            <div className="mt-5 space-y-3">
              {[
                { name: "Mobile Money (Orange, MTN, Wave)", value: "cinetpay" },
                { name: "Carte bancaire (Visa/Mastercard)", value: "stripe" },
              ].map((m, i) => (
                <label key={m.value} className="flex cursor-pointer items-center gap-4 rounded-xl border border-public-border bg-public-bg p-4 transition-all hover:border-accent-orange/30 has-[:checked]:border-accent-orange has-[:checked]:bg-accent-orange/5">
                  <input type="radio" name="methode_paiement" value={m.value} defaultChecked={i === 0} required className="h-4 w-4 accent-accent-orange" />
                  <span className="text-sm font-medium text-public-text">{m.name}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="text-base font-semibold text-public-text">Récapitulatif</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-public-text-muted">Zone (auto)</span>
                <span className="font-medium text-public-text">
                  {adressesRenseignees ? ZONE_LABELS[zone] : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-public-text-muted">Mode</span>
                <span className="font-medium text-public-text">{MODE_LABELS[mode as keyof typeof MODE_LABELS]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-public-text-muted">Palier de poids</span>
                <span className="font-medium text-public-text">
                  {palier ? palier.label : "—"}
                  {palier && palier.multiplicateur !== 1 && (
                    <span className="ml-1 text-xs text-public-text-muted">×{palier.multiplicateur}</span>
                  )}
                </span>
              </div>
            </div>
            <hr className="my-4 border-public-border" />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-semibold text-public-text">Total</span>
              <span className="font-display text-3xl font-medium text-accent-orange">
                {prix !== null ? `${prix.toLocaleString("fr-FR")} FCFA` : "—"}
              </span>
            </div>
            {prix === null && (
              <p className="mt-2 text-xs text-public-text-faint">
                {poidsHorsGrille
                  ? `Au-delà de ${POIDS_MAX_KG} kg : contactez-nous pour un devis.`
                  : "Choisissez les communes et indiquez le poids pour calculer le prix."}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || prix === null}
              className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent-orange px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-accent-orange-hover active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? "Traitement…" : prix !== null ? `Payer ${prix.toLocaleString("fr-FR")} FCFA` : "Complétez le formulaire"}
            </button>

            <Link href="/livraison" className="mt-3 block text-center text-xs text-public-text-muted transition-colors hover:text-public-text">
              Annuler
            </Link>
          </Card>
        </div>
      </form>
    </div>
  )
}
