"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Search, X, Check } from "lucide-react"
import {
  filtrerArticles,
  libelleTypePagne,
  type ArticlePagne,
  type TypePagne,
} from "@/lib/textile"
import { useT, useLangue } from "@/lib/langue-context"
import { remplir, pluriel } from "@/lib/i18n/format"

/**
 * Une vignette du catalogue.
 *
 * Plusieurs photos par article : un pagne se juge de près comme de loin. On
 * les fait défiler au survol des pastilles plutôt qu'en carrousel automatique —
 * un mouvement qu'on ne contrôle pas fatigue plus qu'il ne montre.
 */
function Vignette({
  article,
  choisi,
  onChoisir,
}: {
  article: ArticlePagne
  choisi: boolean
  onChoisir: () => void
}) {
  const t = useT()
  const [photo, setPhoto] = useState(0)
  const src = article.photos[photo]

  return (
    <button
      type="button"
      onClick={onChoisir}
      aria-pressed={choisi}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
        choisi
          ? "border-accent-gold ring-2 ring-accent-gold/30"
          : "border-public-border hover:border-accent-gold/50"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-public-bg-elevated">
        {src ? (
          <Image
            src={src}
            alt={article.nom}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Un article sans photo reste montrable : son nom vaut mieux que rien.
          <span className="absolute inset-0 flex items-center justify-center text-xs text-public-text-faint">
            {t.textile.photoAVenir}
          </span>
        )}

        {choisi && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-gold text-[#0A0A0A]">
            <Check size={16} aria-hidden="true" />
          </span>
        )}

        {article.vedette && !choisi && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-gold/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]">
            {t.textile.coupDeCoeur}
          </span>
        )}

        {article.photos.length > 1 && (
          <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {article.photos.map((_, i) => (
              <span
                key={i}
                onMouseEnter={() => setPhoto(i)}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i === photo ? "w-4 bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-public-text">{article.nom}</p>
        <p className="mt-0.5 text-[11px] text-public-text-faint">
          {article.reference ? remplir(t.textile.reference, { reference: article.reference }) : t.textile.surDevis}
          {article.couleurs ? ` · ${article.couleurs}` : ""}
        </p>
      </div>
    </button>
  )
}

/**
 * Le catalogue, et le choix qu'il permet.
 *
 * Il AJOUTE un chemin, il n'en ferme aucun : le client peut désigner un article
 * ou continuer à décrire ce qu'il cherche. Le formulaire, juste en dessous,
 * s'adapte à ce qu'il a fait.
 */
export function CatalogueClient({
  articles,
  types,
  onChoisir,
  articleChoisi,
}: {
  articles: ArticlePagne[]
  types: TypePagne[]
  onChoisir: (a: ArticlePagne | null) => void
  articleChoisi: string | null
}) {
  const t = useT()
  const { langue } = useLangue()
  const [recherche, setRecherche] = useState("")
  const [type, setType] = useState<string | null>(null)

  // La recherche se fait dans le navigateur : à cette échelle, un aller-retour
  // serveur à chaque lettre coûterait plus qu'il ne rapporte.
  const visibles = useMemo(
    () => filtrerArticles(articles, recherche, type),
    [articles, recherche, type]
  )

  if (articles.length === 0) {
    return (
      <p className="rounded-2xl border border-public-border bg-public-bg-card p-6 text-sm text-public-text-muted">
        {t.textile.catalogueVide}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-public-text-faint"
          />
          <label htmlFor="recherche-pagne" className="sr-only">
            {t.textile.rechercherCatalogue}
          </label>
          <input
            id="recherche-pagne"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t.textile.exempleRecherche}
            className="w-full rounded-xl border border-public-border bg-public-bg py-2.5 pl-9 pr-9 text-sm text-public-text placeholder:text-public-text-faint focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              aria-label={t.textile.effacerRecherche}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-public-text-faint hover:text-public-text"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setType(null)}
            aria-pressed={type === null}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              type === null
                ? "border-accent-gold bg-accent-gold/10 text-public-text"
                : "border-public-border text-public-text-muted hover:text-public-text"
            }`}
          >
            {t.textile.tout}
          </button>
          {types.map((t) => (
            <button
              key={t.cle}
              type="button"
              onClick={() => setType(t.cle)}
              aria-pressed={type === t.cle}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                type === t.cle
                  ? "border-accent-gold bg-accent-gold/10 text-public-text"
                  : "border-public-border text-public-text-muted hover:text-public-text"
              }`}
            >
              {libelleTypePagne(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Dire combien on montre : sans ce compte, filtrer donne l'impression
          que le catalogue a rétréci sans qu'on sache de combien. */}
      <p className="text-xs text-public-text-faint">
        {visibles.length === articles.length
          ? pluriel(langue, { un: t.textile.modele_un, autre: t.textile.modele_pluriel }, articles.length)
          : remplir(t.textile.surTotal, { n: visibles.length, total: articles.length })}
        {articleChoisi && t.textile.modeleSelectionne}
      </p>

      {visibles.length === 0 ? (
        <div className="rounded-2xl border border-public-border bg-public-bg-card p-6 text-center">
          {/* Une recherche sans résultat et une gamme encore vide ne sont pas
              la même chose. Sans cette distinction, filtrer sur une gamme dont
              aucun modèle n'est photographié affichait « Rien ne correspond à
              «  » » — une phrase à trou vide, qui donne l'air cassé. */}
          <p className="text-sm text-public-text-muted">
            {recherche
              ? remplir(t.textile.rienNeCorrespond, { recherche })
              : t.textile.gammeSansModele}
          </p>
          <p className="mt-1 text-xs text-public-text-faint">
            {t.textile.decrivezQuandMeme}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibles.map((a) => (
            <Vignette
              key={a.id}
              article={a}
              choisi={articleChoisi === a.id}
              onChoisir={() => onChoisir(articleChoisi === a.id ? null : a)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
