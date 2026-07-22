import { SVGAttributes, type ReactNode } from "react"

interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: number
}

type IconVariant = "default" | "double"

interface VerticalIconProps extends IconProps {
  variant?: IconVariant
}

function DoubleContourPaths({ children }: { children: ReactNode }) {
  return (
    <>
      <g stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" className="opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:[filter:drop-shadow(0_0_5px_white)]">
        {children}
      </g>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" className="transition-all duration-300">
        {children}
      </g>
    </>
  )
}

function VerticalSvg({ size, variant, className, children, ...props }: VerticalIconProps & { children: ReactNode }) {
  const isDouble = variant === "double"
  return (
    <svg
      width={size ?? 24}
      height={size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      className={`${isDouble ? "group" : ""} ${className ?? ""}`}
      {...props}
    >
      {isDouble ? <DoubleContourPaths>{children}</DoubleContourPaths> : <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</g>}
    </svg>
  )
}

export function TransportIcon({ size = 24, variant = "default", className = "", ...props }: VerticalIconProps) {
  return (
    <VerticalSvg size={size} variant={variant} className={className} {...props}>
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="M5 17H3v-4.5l2-3h4l2 3.5H19a2 2 0 0 1 2 2V17h-1" />
      <path d="M9 17V7h4l3 3v7" />
      <path d="M9 7H5l-2 3" />
    </VerticalSvg>
  )
}

export function ImmobilierIcon({ size = 24, variant = "default", className = "", ...props }: VerticalIconProps) {
  return (
    <VerticalSvg size={size} variant={variant} className={className} {...props}>
      <path d="M3 21h18" />
      <path d="M9 21V9l3-3 3 3v12" />
      <path d="M5 21V7l7-5 7 5v14" />
      <path d="M12 15v3" />
      <path d="M14 9h2" />
      <path d="M8 9h2" />
    </VerticalSvg>
  )
}

export function AssistanceIcon({ size = 24, variant = "default", className = "", ...props }: VerticalIconProps) {
  return (
    <VerticalSvg size={size} variant={variant} className={className} {...props}>
      <path d="M22 16.92v3a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 19.92v-3" />
      <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
      <path d="M4 12V8h16v4" />
      <path d="M2 16h20" />
      <path d="M8 12v4" />
      <path d="M12 12v4" />
      <path d="M16 12v4" />
    </VerticalSvg>
  )
}

export function LivraisonIcon({ size = 24, variant = "default", className = "", ...props }: VerticalIconProps) {
  return (
    <VerticalSvg size={size} variant={variant} className={className} {...props}>
      <path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="M5 17H3v-5.5L5 9h4l1.5 2.5H19a1.5 1.5 0 0 1 1.5 1.5V17h-1.5" />
      <path d="M9 9V5h6l2 4" />
      <path d="M5 9V6a1 1 0 0 1 1-1h3" />
    </VerticalSvg>
  )
}

export function CartIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export function HeartIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function UserIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function PhoneIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export function MailIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export function CheckIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function MenuIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function CloseIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function ClockIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function ShieldIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function AlertIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export function SearchIcon({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
