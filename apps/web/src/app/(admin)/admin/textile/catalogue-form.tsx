"use client"

import { useActionState, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import {
  creerArticlePagne,
  basculerArticlePagne,
  type TextileState,
} from "@/app/actions/textile"
import { SubmitButton } from "@/components/submit-button"
import { Obligatoire } from "@/components/ui/obligatoire"
import { libelleTypePagne, type TypePagne, type ArticlePagne } from "@/lib/textile"

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/12 bg-white px-3 py-2 text-sm text-phoebe-anthracite focus:border-phoebe-green focus:outline-none focus:ring-2 focus:ring-phoebe-green/15"
const labelClass = "mb-1 block text-xs font-medium text-phoebe-anthracite"

const TYPES_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"])
const TAILLE_MAX = 10 * 1024 * 1024

/**
 * Dépôt des photos, depuis le NAVIGATEUR.
 *
 * Un article en compte volontiers trois, à plusieurs mégaoctets chacune : les
 * faire transiter par une Server Action buterait sur son plafond. Elles montent
 * donc directement vers le bucket, et seuls les chemins partent avec le
 * formulaire.
 */
function DeposerPhotos({ onChemins }: { onChemins: (c: string[]) => void }) {
  const [chemins, setChemins] = useState<string[]>([])
  const [apercus, setApercus] = useState<string[]>([])
  const [etat, setEtat] = useState<"vide" | "envoi" | "erreur">("vide")
  const [message, setMessage] = useState("")

  async function envoyer(fichiers: FileList) {
    setEtat("envoi")
    setMessage("")
    const supabase = createClient()
    const nouveaux: string[] = []
    const vues: string[] = []

    for (const f of Array.from(fichiers)) {
      if (!TYPES_IMAGE.has(f.type)) {
        setEtat("erreur")
        setMessage("Formats acceptés : JPEG, PNG ou WebP.")
        return
      }
      if (f.size > TAILLE_MAX) {
        setEtat("erreur")
        setMessage(`« ${f.name} » dépasse 10 Mo.`)
        return
      }
      const ext = f.name.split(".").pop()?.toLowerCase() || "jpg"
      const cible = `articles/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from("catalogue-pagnes")
        .upload(cible, f, { contentType: f.type })
      if (error) {
        setEtat("erreur")
        setMessage("Envoi impossible. Réessayez.")
        return
      }
      nouveaux.push(cible)
      vues.push(supabase.storage.from("catalogue-pagnes").getPublicUrl(cible).data.publicUrl)
    }

    const tous = [...chemins, ...nouveaux]
    setChemins(tous)
    setApercus([...apercus, ...vues])
    onChemins(tous)
    setEtat("vide")
  }

  return (
    <div>
      {chemins.map((c) => (
        <input key={c} type="hidden" name="photos" value={c} />
      ))}
      <label htmlFor="photos-article" className={labelClass}>
        Photos <span className="text-phoebe-anthracite/60">(plusieurs possibles)</span>
      </label>
      <input
        id="photos-article"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) void envoyer(e.target.files)
        }}
        className="w-full text-xs text-phoebe-anthracite/70 file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-xs"
      />
      {etat === "envoi" && <p className="mt-1 text-[11px] text-phoebe-anthracite/60">Envoi…</p>}
      {etat === "erreur" && <p role="alert" className="mt-1 text-[11px] text-error">{message}</p>}
      {apercus.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {apercus.map((u) => (
            <Image key={u} src={u} alt="" width={56} height={70} className="h-16 w-14 rounded object-cover" />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Le catalogue, côté propriétaire.
 *
 * Sans cet écran, la vitrine resterait vide : la page publique montre ce qui
 * est ici, et rien d'autre.
 */
export function CatalogueForm({
  types,
  articles,
}: {
  types: TypePagne[]
  articles: (ArticlePagne & { disponible: boolean })[]
}) {
  const [state, action] = useActionState<TextileState, FormData>(creerArticlePagne, {})
  const [bascule, actionBascule] = useActionState<TextileState, FormData>(basculerArticlePagne, {})
  const [ouvert, setOuvert] = useState(false)
  const [, setChemins] = useState<string[]>([])

  return (
    <div className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-phoebe-anthracite">
          Catalogue ({articles.filter((a) => a.disponible).length} en vitrine)
        </h2>
        <p className="mt-1 text-xs text-phoebe-anthracite/70">
          Ce que le client voit sur la page Textile. Aucun prix ne s&apos;y
          affiche : le montant se fixe demande par demande.
        </p>
      </div>

      {articles.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {articles.map((a) => (
            <li
              key={a.id}
              className={`overflow-hidden rounded-lg border ${
                a.disponible ? "border-phoebe-pearl" : "border-phoebe-anthracite/10 opacity-60"
              }`}
            >
              <div className="relative aspect-[4/5] bg-phoebe-pearl/40">
                {a.photos[0] ? (
                  <Image src={a.photos[0]} alt={a.nom} fill sizes="160px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-phoebe-anthracite/50">
                    Sans photo
                  </span>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-phoebe-anthracite">{a.nom}</p>
                {a.vedette && (
                  <p className="text-[10px] font-semibold uppercase text-phoebe-gold-dark">
                    Coup de cœur
                  </p>
                )}
                <form action={actionBascule} className="mt-1">
                  <input type="hidden" name="article_id" value={a.id} />
                  <input type="hidden" name="disponible" value={a.disponible ? "0" : "1"} />
                  <button
                    type="submit"
                    className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted hover:text-error"
                  >
                    {a.disponible ? "Retirer" : "Remettre"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {bascule.error && <p role="alert" className="text-xs text-error">{bascule.error}</p>}

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="text-xs font-medium text-phoebe-green underline decoration-dotted"
        >
          Ajouter un modèle
        </button>
      ) : (
        <form action={action} className="space-y-3 rounded-lg border border-phoebe-green/30 bg-phoebe-green/5 p-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="a-nom" className={labelClass}>Nom du modèle<Obligatoire /></label>
              <input id="a-nom" name="nom" required placeholder="Ex. Fleur de mariage" className={inputClass} />
            </div>
            <div>
              <label htmlFor="a-type" className={labelClass}>Gamme<Obligatoire /></label>
              <select id="a-type" name="type_pagne" required className={inputClass}>
                {types.map((t) => (
                  <option key={t.cle} value={t.cle}>{libelleTypePagne(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="a-ref" className={labelClass}>Référence</label>
              <input id="a-ref" name="reference" placeholder="Ex. UW23458" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="a-couleurs" className={labelClass}>Couleurs</label>
              <input id="a-couleurs" name="couleurs" placeholder="Bleu et or" className={inputClass} />
            </div>
            <div>
              <label className="mt-6 flex items-center gap-2 text-xs text-phoebe-anthracite">
                <input type="checkbox" name="vedette" className="h-3.5 w-3.5 accent-phoebe-gold" />
                Coup de cœur
              </label>
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="a-desc" className={labelClass}>Description</label>
              <input id="a-desc" name="description" placeholder="Ce qui distingue ce modèle" className={inputClass} />
            </div>
            <div className="sm:col-span-3">
              <DeposerPhotos onChemins={setChemins} />
            </div>
          </div>

          {state.error && <p role="alert" className="text-xs text-error">{state.error}</p>}
          {state.success && <p role="status" className="text-xs text-phoebe-green-deep">Modèle ajouté.</p>}

          <div className="flex items-center gap-3">
            <SubmitButton>Ajouter au catalogue</SubmitButton>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="text-[11px] text-phoebe-anthracite/60 underline decoration-dotted"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
