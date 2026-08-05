import { ShieldCheck } from "lucide-react"
import { getT } from "@/lib/i18n/server"

/**
 * Garantie documentaire affichée sur chaque bien. Elle vaut pour l'ensemble du
 * catalogue GROUP PHOEBE : les pièces sont en règle et présentables devant
 * notaire au moment de finaliser.
 *
 * Volontairement statique et non paramétrable par bien : c'est un engagement
 * d'ensemble. Si un jour un bien devait y échapper, il faudrait un indicateur
 * en base plutôt que retirer ce bloc au cas par cas — un engagement affiché
 * partout sauf sur un bien se remarque davantage que son absence générale.
 */
/**
 * Composant SERVEUR : il passe donc par `getT()`, pas `useT()`.
 *
 * Le distinguo n'est pas cosmétique — appeler le hook client ici fait tomber
 * la page entière au rendu, et ni `tsc` ni ESLint ne le voient. Seul le
 * navigateur le dit.
 */
export async function GarantieDocuments({ variante = "bloc" }: { variante?: "bloc" | "ligne" }) {
  const t = await getT()
  if (variante === "ligne") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-green">
        <ShieldCheck size={14} aria-hidden="true" />
        {t.immobilier.documentsEnRegle}
      </span>
    )
  }

  return (
    <div className="rounded-2xl border border-accent-green/25 bg-accent-green/5 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-public-text">
        <ShieldCheck size={18} className="text-accent-green" aria-hidden="true" />
        {t.immobilier.documentsEnRegle}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-public-text-muted">
        {t.immobilier.documentsEnRegleTexte}
      </p>
    </div>
  )
}
