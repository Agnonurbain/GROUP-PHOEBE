import { ButtonHTMLAttributes } from "react"

type Variant =
  | "default"
  | "admin"
  | "danger"
  | "admin-danger"
  | "ghost"
  | "admin-ghost"
  | "orange"
  | "blue"
  | "green"
  | "icon"
  | "text-link"
  | "admin-tab"
  | "admin-icon"
  | "admin-alert"

type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  default: "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#B8943A]",
  admin: "bg-phoebe-green text-white hover:bg-phoebe-green-deep",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
  "admin-danger": "bg-error text-white hover:bg-[#B91C1C]",
  ghost: "border border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#1A1A1A]",
  "admin-ghost": "border border-phoebe-anthracite/20 text-phoebe-anthracite/70 hover:bg-phoebe-pearl",
  orange: "bg-accent-orange text-white hover:bg-accent-orange-hover",
  blue: "bg-accent-blue text-white hover:bg-accent-blue-hover",
  green: "bg-accent-green text-white hover:bg-accent-green-hover",
  icon: "text-public-text-muted hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] p-1.5 rounded-lg inline-flex items-center justify-center min-h-11 min-w-11",
  "text-link": "text-public-text-muted hover:text-[#F5F5F5] underline-offset-2 hover:underline",
  "admin-tab": "bg-transparent text-phoebe-anthracite/70 hover:text-phoebe-anthracite px-4 py-2 border-b-2 border-transparent hover:border-phoebe-anthracite/20 data-[active=true]:border-phoebe-gold data-[active=true]:text-phoebe-anthracite",
  "admin-icon": "bg-transparent text-phoebe-anthracite/70 hover:text-phoebe-anthracite hover:bg-phoebe-pearl p-2 rounded-lg inline-flex items-center justify-center min-h-11 min-w-11",
  "admin-alert": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20",
}

// Sur écran tactile, toutes les tailles atteignent la cible de 44px (WCAG 2.5.5)
const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs font-medium max-sm:min-h-11",
  md: "px-5 py-2.5 text-sm font-semibold max-sm:min-h-12",
  lg: "px-6 py-3 text-base font-semibold max-sm:min-h-12",
}

const NO_SIZE_VARIANTS: Variant[] = ["icon", "text-link", "admin-icon"]

export function Button({ variant = "default", size = "md", className = "", children, ...props }: ButtonProps) {
  const includeSize = !NO_SIZE_VARIANTS.includes(variant)
  return (
    <button
      className={`rounded-lg transition-colors ${includeSize ? SIZES[size] : ""} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
