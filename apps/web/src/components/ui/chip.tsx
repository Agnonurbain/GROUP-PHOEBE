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
    active: "border-[#F5F5F5] bg-white/10 text-[#F5F5F5]",
    inactive: "border-[#2A2A2A] text-[#8A8A8A] hover:border-white/20 hover:text-[#F5F5F5]",
  },
  orange: {
    active: "border-accent-orange bg-[rgba(249,115,22,0.1)] text-accent-orange",
    inactive: "border-[#2A2A2A] text-[#8A8A8A] hover:border-accent-orange/30 hover:text-[#F5F5F5]",
  },
  blue: {
    active: "border-accent-blue-on-dark bg-[rgba(37,99,235,0.15)] text-accent-blue-on-dark",
    inactive: "border-[#2A2A2A] text-[#8A8A8A] hover:border-accent-blue/30 hover:text-[#F5F5F5]",
  },
  green: {
    active: "border-accent-green bg-[rgba(5,150,105,0.1)] text-accent-green",
    inactive: "border-[#2A2A2A] text-[#8A8A8A] hover:border-accent-green/30 hover:text-[#F5F5F5]",
  },
  gold: {
    active: "border-accent-gold bg-[rgba(201,168,76,0.1)] text-accent-gold",
    inactive: "border-[#2A2A2A] text-[#8A8A8A] hover:border-accent-gold/30 hover:text-[#F5F5F5]",
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
