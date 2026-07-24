import { InputHTMLAttributes } from "react"

type Variant = "default" | "public" | "admin"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant
}

// Placeholders : #4A4A4A (2.2:1) et #6B7280 (4.1:1) étaient sous le seuil AA.
const VARIANTS: Record<Variant, string> = {
  default: "bg-[#0A0A0A] border-[#2A2A2A] text-[#F5F5F5] placeholder-public-text-muted focus:border-[#C9A84C]/50 rounded-lg",
  public: "bg-[#0A0A0A] border-public-border text-public-text placeholder:text-public-text-muted focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30 rounded-xl",
  admin: "bg-white border-phoebe-anthracite/20 text-phoebe-anthracite placeholder-phoebe-anthracite/70 focus:border-phoebe-green rounded-lg",
}

export function Input({ variant = "default", className = "", ...props }: InputProps) {
  return (
    <input
      className={`w-full border px-4 py-2.5 text-sm outline-none transition-colors max-sm:min-h-11 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
