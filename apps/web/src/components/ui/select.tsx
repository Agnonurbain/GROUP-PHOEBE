import { SelectHTMLAttributes } from "react"

type Variant = "default" | "admin"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  default: "bg-[#0A0A0A] border-[#2A2A2A] text-[#F5F5F5]",
  admin: "bg-white border-phoebe-anthracite/20 text-phoebe-anthracite",
}

export function Select({ variant = "default", className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors max-sm:min-h-11 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
