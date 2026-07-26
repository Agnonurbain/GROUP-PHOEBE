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
    active: "border-[#EDE9E3] bg-white/10 text-[#EDE9E3]",
    inactive: "border-[#423C35] text-[#A79F95] hover:border-white/20 hover:text-[#EDE9E3]",
  },
  orange: {
    active: "border-accent-orange bg-[rgba(249,115,22,0.1)] text-accent-orange",
    inactive: "border-[#423C35] text-[#A79F95] hover:border-accent-orange/30 hover:text-[#EDE9E3]",
  },
  blue: {
    active: "border-accent-blue-on-dark bg-[rgba(37,99,235,0.15)] text-accent-blue-on-dark",
    inactive: "border-[#423C35] text-[#A79F95] hover:border-accent-blue/30 hover:text-[#EDE9E3]",
  },
  green: {
    active: "border-accent-green bg-[rgba(5,150,105,0.1)] text-accent-green",
    inactive: "border-[#423C35] text-[#A79F95] hover:border-accent-green/30 hover:text-[#EDE9E3]",
  },
  gold: {
    active: "border-accent-gold bg-[rgba(201,168,76,0.1)] text-accent-gold",
    inactive: "border-[#423C35] text-[#A79F95] hover:border-accent-gold/30 hover:text-[#EDE9E3]",
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
