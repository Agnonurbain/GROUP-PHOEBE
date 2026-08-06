"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ArrowRight, Plane } from "lucide-react"
import { creerDemandeBillet, type BilletState } from "@/app/actions/billets"
import {
  CLASSES,
  TYPES_TRAJET,
  libelleVoyageurs,
  libelleDelai,
  type ParametresBillet,
} from "@/lib/billets"
import { DeposerPasseport, PasseportAccompagnant } from "@/components/public/passeport-voyageur"
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"
import { libelle, remplir } from "@/lib/i18n/format"
const champ =
  "w-full rounded-xl border border-public-border bg-public-bg px-4 py-2.5 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
const label = "mb-1.5 block text-xs font-medium text-public-text-muted"

/** Aéroports les plus demandés. Le champ reste libre : la liste n'est qu'une aide. */
const AEROPORTS = [
  "Abidjan (ABJ)", "Paris (CDG)", "Paris (ORY)", "Bruxelles (BRU)", "Casablanca (CMN)",
  "Istanbul (IST)", "Dubaï (DXB)", "Pékin (PEK)", "Shanghai (PVG)", "Guangzhou (CAN)",
  "Dakar (DSS)", "Accra (ACC)", "Lomé (LFW)", "Bamako (BKO)", "Ouagadougou (OUA)",
  "Montréal (YUL)", "New York (JFK)", "Lisbonne (LIS)", "Rome (FCO)", "Athènes (ATH)",
  "Oslo (OSL)",
]

const aujourdHui = () => new Date().toISOString().slice(0, 10)

export function BilletForm({
  isLoggedIn,
  userId,
  params,
}: {
  isLoggedIn: boolean
  /** Identifiant du client : préfixe du chemin de dépôt des passeports. */
  userId: string
  /** Frais et règles pilotés par le propriétaire depuis /admin/tarifs. */
  params: ParametresBillet
}) {
  const t = useT()
  const [state, action, pending] = useActionState<BilletState, FormData>(creerDemandeBillet, {})
  const [typeTrajet, setTypeTrajet] = useState<string>("aller_retour")
  const [voyageurs, setVoyageurs] = useState({ adultes: 1, enfants: 0, bebes: 0 })
  const [panneauVoyageurs, setPanneauVoyageurs] = useState(false)
  const [certificatFievreJaune, setCertificatFievreJaune] = useState(false)
  const [mineurAutorisation, setMineurAutorisation] = useState(false)

  const majVoyageurs = (cle: keyof typeof voyageurs, delta: number) =>
    setVoyageurs((v) => ({ ...v, [cle]: Math.max(cle === "adultes" ? 1 : 0, v[cle] + delta) }))

  /**
   * Un bloc par accompagnant, dans l'ordre : les adultes puis les enfants.
   * Le voyageur 1 est le titulaire de la demande, déjà saisi au-dessus — d'où
   * `adultes - 1`. Les bébés de moins de 2 ans n'en ont pas.
   */
  const accompagnants: ("adulte" | "enfant")[] = [
    ...Array<"adulte">(Math.max(0, voyageurs.adultes - 1)).fill("adulte"),
    ...Array<"enfant">(voyageurs.enfants).fill("enfant"),
  ]

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-public-border bg-public-bg-card p-8 text-center">
        <Plane size={28} className="mx-auto text-accent-blue-on-dark" aria-hidden="true" />
        <p className="mt-3 text-sm text-public-text-muted">
          {t.assistance.connexionBillet}
        </p>
        <Link
          href="/connexion?redirect=/assistance"
          className="mt-5 inline-block rounded-xl bg-accent-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="type_trajet" value={typeTrajet} />
      <input type="hidden" name="nb_adultes" value={voyageurs.adultes} />
      <input type="hidden" name="nb_enfants" value={voyageurs.enfants} />
      <input type="hidden" name="nb_bebes" value={voyageurs.bebes} />
      <input type="hidden" name="certificat_fievre_jaune" value={certificatFievreJaune ? "1" : "0"} />
      <input type="hidden" name="mineur_autorisation_parentale" value={mineurAutorisation ? "1" : "0"} />

      {state.error && (
        <p role="alert" className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {state.error}
        </p>
      )}

      {/* Barre supérieure : type de trajet et classe */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label={t.assistance.typeTrajet}>
          {TYPES_TRAJET.map((trajet) => (
            <button
              key={trajet}
              type="button"
              role="radio"
              aria-checked={typeTrajet === trajet}
              onClick={() => setTypeTrajet(trajet)}
              className="flex items-center gap-2 text-sm font-medium text-public-text"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                  typeTrajet === trajet ? "border-accent-blue" : "border-public-border"
                }`}
              >
                {typeTrajet === trajet && <span className="h-2 w-2 rounded-full bg-accent-blue" />}
              </span>
              {libelle(t.libelles.typeTrajet, trajet)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="classe" className="text-xs font-medium text-public-text-muted">
            Classe
          </label>
          <select id="classe" name="classe" defaultValue="economique" className={`${champ} w-auto py-2`}>
            {CLASSES.map((c) => (
              <option key={c} value={c}>{libelle(t.libelles.classeVol, c)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ligne principale : trajet, dates, voyageurs */}
      <div className="grid gap-4 rounded-2xl border border-public-border bg-public-bg-card p-5 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="depart" className={label}>{t.assistance.douPartezVous}<Obligatoire /></label>
          <input id="depart" name="depart" list="aeroports" required placeholder="Abidjan (ABJ)" className={champ} />
        </div>
        <div>
          <label htmlFor="destination" className={label}>{t.assistance.ouAllezVous}<Obligatoire /></label>
          <input id="destination" name="destination" list="aeroports" required placeholder="Paris (CDG)" className={champ} />
        </div>
        <datalist id="aeroports">
          {AEROPORTS.map((a) => <option key={a} value={a} />)}
        </datalist>

        <div>
          <label htmlFor="date_depart" className={label}>{t.assistance.dateDepart}<Obligatoire /></label>
          <input
            id="date_depart"
            name="date_depart"
            type="date"
            required
            min={aujourdHui()}
            className={`${champ} [color-scheme:dark]`}
          />
        </div>
        <div>
          <label htmlFor="date_retour" className={label}>
            Date de retour {typeTrajet === "aller_simple" && "(aller simple)"}
          </label>
          <input
            id="date_retour"
            name="date_retour"
            type="date"
            required={typeTrajet === "aller_retour"}
            disabled={typeTrajet === "aller_simple"}
            min={aujourdHui()}
            className={`${champ} [color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-40`}
          />
        </div>

        <div className="relative">
          <span className={label}>Voyageurs</span>
          <button
            type="button"
            onClick={() => setPanneauVoyageurs((o) => !o)}
            aria-expanded={panneauVoyageurs}
            className={`${champ} text-left`}
          >
            {libelleVoyageurs(voyageurs)}
          </button>

          {panneauVoyageurs && (
            <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-public-border bg-public-bg-card p-4 shadow-lg">
              {([
                { cle: "adultes" as const, titre: "Adultes", detail: "12 ans et plus" },
                { cle: "enfants" as const, titre: "Enfants", detail: "de 2 à 11 ans" },
                { cle: "bebes" as const, titre: "Bébés", detail: "moins de 2 ans" },
              ]).map(({ cle, titre, detail }) => (
                <div key={cle} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-public-text">{titre}</p>
                    <p className="text-xs text-public-text-faint">{detail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => majVoyageurs(cle, -1)}
                      aria-label={`Retirer un ${titre.toLowerCase()}`}
                      className="h-7 w-7 rounded-full border border-public-border text-public-text transition-colors hover:border-accent-blue disabled:opacity-30"
                      disabled={voyageurs[cle] <= (cle === "adultes" ? 1 : 0)}
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm font-semibold text-public-text">
                      {voyageurs[cle]}
                    </span>
                    <button
                      type="button"
                      onClick={() => majVoyageurs(cle, 1)}
                      aria-label={`Ajouter un ${titre.toLowerCase()}`}
                      className="h-7 w-7 rounded-full border border-public-border text-public-text transition-colors hover:border-accent-blue"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <p className="mt-2 border-t border-public-border pt-2 text-xs text-public-text-faint">
                {remplir(t.assistance.bebeSurGenoux, { max: params.max_voyageurs })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Passeport : indispensable pour émettre un billet */}
      <fieldset className="rounded-2xl border border-public-border bg-public-bg-card p-5">
        <legend className="px-1 text-sm font-semibold text-public-text">
          {t.assistance.passeportPrincipal}
        </legend>
        <p className="mt-1 text-xs text-public-text-muted">
          {t.assistance.nomExactPasseport}
          {params.mois_validite_passeport > 0 && (
            <> {remplir(t.assistance.validiteApresDepart, { mois: params.mois_validite_passeport })}</>
          )}
        </p>
        <p className="mt-1.5 text-xs text-accent-blue/80">
          {t.assistance.passeportExigeCedeao}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="passeport_nom" className={label}>{t.assistance.nomPrenoms}<Obligatoire /></label>
            <input id="passeport_nom" name="passeport_nom" required placeholder="Tels qu'inscrits" className={champ} />
          </div>
          <div>
            <label htmlFor="passeport_numero" className={label}>{t.assistance.numeroPasseport}<Obligatoire /></label>
            <input id="passeport_numero" name="passeport_numero" required placeholder="Ex. 21AB45678" className={champ} />
          </div>
          <div>
            <label htmlFor="passeport_expiration" className={label}>{t.assistance.dateExpiration}<Obligatoire /></label>
            <input
              id="passeport_expiration"
              name="passeport_expiration"
              type="date"
              required
              min={aujourdHui()}
              className={`${champ} [color-scheme:dark]`}
            />
          </div>
        </div>
        <div className="mt-4">
          <DeposerPasseport name="passeport_fichier" userId={userId} id="passeport_fichier_input" />
          <p className="mt-1 text-[11px] text-public-text-faint">
            {t.assistance.joindrePagePasseport}
          </p>
        </div>
      </fieldset>

      {/* Accompagnants : la compagnie exige le passeport de CHAQUE voyageur pour
          émettre son billet. Ils étaient demandés à l'étape du paiement, où
          aucun champ ne les envoyait — toute demande à plus d'un voyageur était
          donc impayable. */}
      {accompagnants.length > 0 && (
        <fieldset className="rounded-2xl border border-public-border bg-public-bg-card p-5">
          <legend className="px-1 text-sm font-semibold text-public-text">
            {remplir(t.assistance.passeportsAutres, { n: accompagnants.length })}
          </legend>
          <p className="mt-1 text-xs text-public-text-muted">
            {t.assistance.memesInformations}
          </p>
          {voyageurs.bebes > 0 && (
            <p className="mt-1.5 text-xs text-accent-blue/80">
              Les {voyageurs.bebes === 1 ? "bébés" : "bébés"} de moins de 2 ans ne sont pas
              à saisir ici : ils voyagent sur les genoux d&apos;un adulte. Nous reviendrons
              vers vous pour leur document avant l&apos;émission.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {accompagnants.map((type, i) => (
              <PasseportAccompagnant
                key={i}
                index={i}
                type={type}
                userId={userId}
                moisValidite={params.mois_validite_passeport}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* Documents obligatoires : fièvre jaune et autorisation parentale */}
      <fieldset className="rounded-2xl border border-public-border bg-public-bg-card p-5">
        <legend className="px-1 text-sm font-semibold text-public-text">
          Documents obligatoires
        </legend>

        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={certificatFievreJaune}
            onChange={(e) => setCertificatFievreJaune(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-public-border bg-public-bg text-accent-blue focus:ring-accent-blue/30"
          />
          <div>
            <p className="text-sm font-medium text-public-text">
              {t.assistance.certificatFievreJaune}
            </p>
            <p className="mt-0.5 text-xs text-public-text-muted">
              {t.assistance.fievreJauneObligatoire}
            </p>
          </div>
        </label>

        {voyageurs.enfants > 0 && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-public-border pt-4">
            <input
              type="checkbox"
              checked={mineurAutorisation}
              onChange={(e) => setMineurAutorisation(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-public-border bg-public-bg text-accent-blue focus:ring-accent-blue/30"
            />
            <div>
              <p className="text-sm font-medium text-public-text">
                {t.assistance.autorisationParentaleCase}
              </p>
              <p className="mt-0.5 text-xs text-public-text-muted">
                {t.assistance.mineurAutorisation}
              </p>
            </div>
          </label>
        )}

        {voyageurs.enfants > 0 && !mineurAutorisation && (
          <p className="mt-3 text-xs text-error/80">
            {t.assistance.autorisationParentale}
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor="message" className={label}>{t.assistance.precisionsOptionnel}</label>
        <textarea
          id="message"
          name="message"
          rows={2}
          placeholder={t.assistance.exemplePrecisions}
          className={champ}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-blue px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-blue-hover active:scale-[0.99] disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Envoi…" : "Demander mon billet"}
        {!pending && <ArrowRight size={16} aria-hidden="true" />}
      </button>

      {/* Dire ce que fait le bouton : il n'y a pas de recherche en direct, et
          promettre des résultats immédiats décevrait à coup sûr. */}
      {params.frais_service > 0 && (
        <div className="rounded-xl border border-accent-blue/25 bg-accent-blue/5 p-4">
          <p className="text-sm font-semibold text-public-text">
            {remplir(t.assistance.fraisService, { montant: params.frais_service.toLocaleString("fr-FR") })}
          </p>
          <p className="mt-1 text-xs text-public-text-muted">
            {t.assistance.fraisServiceDetail}
          </p>
        </div>
      )}

      <p className="text-xs text-public-text-faint">
        {remplir(t.assistance.aucunPaiementDelai, {
          delai: libelleDelai(params.delai_reponse_heures),
        })}
      </p>
    </form>
  )
}
