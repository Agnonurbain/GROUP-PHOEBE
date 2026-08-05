"use client"

import { useState, useRef } from "react"
import { CatalogueClient } from "./catalogue-client"
import { DemandeTextileForm } from "./demande-form"
import type { ArticlePagne, TypePagne } from "@/lib/textile"

/**
 * Le catalogue et la demande, réunis.
 *
 * Ils partagent une seule chose — l'article choisi — et c'est pour cela qu'ils
 * vivent sous le même parent plutôt que côte à côte : deux états séparés
 * auraient fini par diverger, et le client aurait envoyé une demande portant un
 * modèle qu'il croyait avoir désélectionné.
 *
 * Le catalogue reste visible sans compte : c'est une vitrine. Seule la demande
 * exige une connexion.
 */
export function TextileClient({
  isLoggedIn,
  types,
  articles,
}: {
  isLoggedIn: boolean
  types: TypePagne[]
  articles: ArticlePagne[]
}) {
  const [article, setArticle] = useState<ArticlePagne | null>(null)
  const formulaire = useRef<HTMLDivElement>(null)

  function choisir(a: ArticlePagne | null) {
    setArticle(a)
    // Choisir un modèle sans rien voir se passer laisserait croire que le clic
    // n'a pas pris. On amène le client là où son choix a un effet.
    if (a) {
      formulaire.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="space-y-16">
      <CatalogueClient
        articles={articles}
        types={types}
        onChoisir={choisir}
        articleChoisi={article?.id ?? null}
      />

      <div ref={formulaire} className="scroll-mt-24">
        <DemandeTextileForm
          isLoggedIn={isLoggedIn}
          types={types}
          article={article}
          onRetirerArticle={() => setArticle(null)}
        />
      </div>
    </div>
  )
}
