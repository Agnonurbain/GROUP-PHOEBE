import Link from "next/link"
import { Obligatoire } from "@/components/ui/obligatoire"
import { useT } from "@/lib/langue-context"
import { avecElements } from "@/lib/i18n/format-jsx"

/**
 * Consentement aux conditions générales.
 *
 * `demandes_transport.accepte_cgv` existe depuis la migration initiale et
 * n'était jamais rempli : aucune case n'était présentée nulle part, et les
 * trois liens légaux du pied de page pointaient vers `#`. La colonne enregistre
 * désormais un consentement réellement recueilli.
 *
 * `required` côté navigateur, et exigé côté serveur : une case cochée dans le
 * DOM n'est pas une preuve.
 */
export function AccepterCgv({ id = "accepte_cgv" }: { id?: string }) {
  const t = useT()
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-xl border border-public-border p-4 text-sm text-public-text-muted"
    >
      <input
        id={id}
        name="accepte_cgv"
        type="checkbox"
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-accent-orange"
      />
      <span>
        {avecElements(t.divers.accepteCgv, {
          cgv: (
            <Link href="/legal/cgv" target="_blank" className="font-medium text-accent-orange underline">
              {t.divers.conditionsVente}
            </Link>
          ),
          confidentialite: (
            <Link href="/legal/confidentialite" target="_blank" className="font-medium text-accent-orange underline">
              {t.divers.politiqueConfidentialite}
            </Link>
          ),
        })}
        <Obligatoire />
      </span>
    </label>
  )
}
