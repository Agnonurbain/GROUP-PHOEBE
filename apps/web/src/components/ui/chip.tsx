import { ButtonHTMLAttributes, type ReactNode } from "react"

type ChipVariant = "default" | "orange" | "blue" | "green" | "gold"

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  chipVariant?: ChipVariant
  startIcon?: ReactNode
}

const VARIANTS: Record<ChipVariant, { active: string; inactive: string }> = {
  default: {
    active: "border-public-text bg-white/10 text-public-text",
    inactive: "border-public-border text-public-text-muted hover:border-white/20 hover:text-public-text",
  },
  orange: {
    active: "border-accent-orange bg-[rgba(249,115,22,0.1)] text-accent-orange",
    inactive: "border-public-border text-public-text-muted hover:border-accent-orange/30 hover:text-public-text",
  },
  blue: {
    active: "border-accent-blue-on-dark bg-[rgba(37,99,235,0.15)] text-accent-blue-on-dark",
    inactive: "border-public-border text-public-text-muted hover:border-accent-blue/30 hover:text-public-text",
  },
  green: {
    active: "border-accent-green bg-[rgba(5,150,105,0.1)] text-accent-green",
    inactive: "border-public-border text-public-text-muted hover:border-accent-green/30 hover:text-public-text",
  },
  gold: {
    active: "border-accent-gold bg-[rgba(201,168,76,0.1)] text-accent-gold",
    inactive: "border-public-border text-public-text-muted hover:border-accent-gold/30 hover:text-public-text",
  },
}

export function Chip({ label, startIcon, active = false, chipVariant = "orange", className = "", ...props }: ChipProps) {
  const v = VARIANTS[chipVariant]
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none max-sm:min-h-11 ${active ? v.active : v.inactive} ${className}`}
      {...props}
    >
      {startIcon && <span className="shrink-0">{startIcon}</span>}
      {label}
    </button>
  )
}
