import { HTMLAttributes } from "react"

type Variant = "gold" | "orange" | "green" | "blue" | "admin-green" | "admin-gold" | "admin-error"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  gold: "bg-[rgba(201,168,76,0.15)] text-[#C9A84C]",
  orange: "bg-[rgba(249,115,22,0.15)] text-[#F97316]",
  green: "bg-[rgba(5,150,105,0.15)] text-[#059669]",
  blue: "bg-[rgba(37,99,235,0.15)] text-[#2563EB]",
  "admin-green": "bg-phoebe-green/10 text-phoebe-green-deep",
  "admin-gold": "bg-phoebe-gold/15 text-phoebe-gold-dark",
  "admin-error": "bg-error/10 text-error",
}

export function Badge({ variant = "gold", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
