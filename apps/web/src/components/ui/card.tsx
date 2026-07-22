import { HTMLAttributes } from "react"

type Variant = "default" | "admin" | "accent-gold" | "accent-green" | "accent-orange" | "accent-blue"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  default: "border-[#2A2A2A] bg-[#141414] hover:bg-[#1A1A1A]",
  admin: "border-phoebe-pearl bg-white hover:shadow-lg",
  "accent-gold": "border-[#C9A84C]/30 bg-[rgba(201,168,76,0.05)]",
  "accent-green": "border-[rgba(5,150,105,0.3)] bg-[rgba(5,150,105,0.05)]",
  "accent-orange": "border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.05)]",
  "accent-blue": "border-[rgba(37,99,235,0.3)] bg-[rgba(37,99,235,0.05)]",
}

export function Card({ variant = "default", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
