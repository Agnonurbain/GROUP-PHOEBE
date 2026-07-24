import Link from "next/link"

// Flèche de retour vers la page parente (href explicite : fiable même en
// arrivée directe par lien profond, contrairement à history.back()).
export function BackLink({
  href,
  label,
  className = "text-public-text-muted hover:text-public-text",
}: {
  href: string
  label: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 text-sm transition-colors ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      {label}
    </Link>
  )
}
