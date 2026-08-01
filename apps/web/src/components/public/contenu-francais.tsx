import { getT, langueCourante } from "@/lib/i18n/server"

/**
 * Mention affichée sous le contenu métier resté en français.
 *
 * La traduction porte sur l'interface : descriptions de biens, articles et
 * pages légales restent en français, parce qu'une traduction approximative d'un
 * texte qui engage l'entreprise se voit et vaut moins que son absence assumée.
 *
 * Le taire laisserait croire à une traduction manquante plutôt qu'à un choix —
 * et un visiteur anglophone se demanderait si le site est cassé.
 */
export async function ContenuFrancais() {
  const langue = await langueCourante()
  if (langue === "fr") return null

  const t = await getT()
  return (
    <p className="mt-4 rounded-lg border border-public-border px-4 py-2 text-xs text-public-text-muted">
      {t.langue.contenuNonTraduit}
    </p>
  )
}
