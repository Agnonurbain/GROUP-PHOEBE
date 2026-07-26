import { CheckIcon } from "@/components/icons"

const STEPS = [
  { label: "Récapitulatif", href: "/panier" },
  { label: "Paiement", href: "/panier/paiement" },
  { label: "Confirmation", href: "" },
]

export function PanierStepper({ current }: { current: number }) {
  return (
    <nav aria-label="Progression de la commande" className="border-b border-public-border px-6 py-5 sm:px-10">
      <ol className="mx-auto flex max-w-xl items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <li
              key={step.label}
              className="flex items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  done
                    ? "bg-accent-green text-white"
                    : active
                      ? "bg-accent-gold text-[#0A0A0A]"
                      : "border border-public-border text-public-text-faint"
                }`}
              >
                {done ? <CheckIcon size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  active ? "text-public-text" : "text-public-text-faint"
                }`}
              >
                {step.label}
                {done && <span className="sr-only"> (terminé)</span>}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-px w-8 ${done ? "bg-accent-green" : "bg-public-border"}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
