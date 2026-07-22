const STEPS = [
  { label: "Récapitulatif", href: "/panier" },
  { label: "Paiement", href: "/panier/paiement" },
  { label: "Confirmation", href: "" },
]

export function PanierStepper({ current }: { current: number }) {
  return (
    <div className="px-6 pt-6">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done
                    ? "bg-[#059669] text-white"
                    : active
                      ? "bg-[#C9A84C] text-[#0A0A0A]"
                      : "border border-[#2A2A2A] text-[#4A4A4A]"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-[#F5F5F5]" : "text-[#4A4A4A]"
                }`}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px w-8 ${
                    done ? "bg-[#059669]" : "bg-[#2A2A2A]"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
