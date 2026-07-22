import { SVGAttributes } from "react"

interface LogoProps extends SVGAttributes<SVGSVGElement> {
  variant?: "default" | "admin"
}

export function PhoebeLogo({ variant = "default", className = "", ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 180 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="GROUP PHOEBE"
      {...props}
    >
      <defs>
        <linearGradient id="lg-default" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={variant === "admin" ? "#D38C37" : "#C9A84C"} />
          <stop offset="100%" stopColor={variant === "admin" ? "#E5A84A" : "#B8943A"} />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="28"
        fontSize="24"
        fontWeight="800"
        letterSpacing="2"
        fill={`url(#lg-${variant})`}
        fontFamily="system-ui, sans-serif"
      >
        GROUP
      </text>
      <text
        x="112"
        y="28"
        fontSize="24"
        fontWeight="300"
        letterSpacing="4"
        fill={variant === "admin" ? "#22282B" : "#F5F5F5"}
        fontFamily="system-ui, sans-serif"
      >
        PHOEBE
      </text>
    </svg>
  )
}
