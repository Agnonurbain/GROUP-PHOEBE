import { CheckIcon } from "@/components/icons"

const STEPS = [
  { label: "Récapitulatif", href: "/panier" },
  { label: "Paiement", href: "/panier/paiement" },
  { label: "Confirmation", href: "" },
]

export function PanierStepper({ current }: { current: number }) {
  return (
    <nav aria-label="Progression de la commande" className="px-6 pt-6">
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
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-[#059669] text-white"
                    : active
                      ? "bg-[#C9A84C] text-[#0A0A0A]"
                      : "border border-[#2A2A2A] text-public-text-faint"
                }`}
              >
                {done ? <CheckIcon size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`text-xs font-medium ${
                  active ? "text-[#F5F5F5]" : "text-public-text-faint"
                }`}
              >
                {step.label}
                {done && <span className="sr-only"> (terminé)</span>}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-px w-8 ${done ? "bg-[#059669]" : "bg-[#2A2A2A]"}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
