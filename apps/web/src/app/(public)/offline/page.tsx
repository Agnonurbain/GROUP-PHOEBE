import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Hors ligne — GROUP PHOEBE",
  description: "Vous êtes actuellement hors ligne.",
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-public-bg px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-public-bg-card">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-public-text">Vous êtes hors ligne</h1>
        <p className="mt-3 text-sm text-public-text-muted">
          Vérifiez votre connexion internet. Les pages déjà consultées restent accessibles.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-accent-gold-hover"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
