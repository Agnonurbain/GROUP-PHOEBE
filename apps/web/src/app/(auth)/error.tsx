"use client"

import Link from "next/link"

export default function AuthError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-phoebe-anthracite">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-phoebe-anthracite/70">Un problème technique est survenu. Veuillez réessayer.</p>
      <div className="mt-8 flex gap-4">
        <button onClick={reset} className="rounded-lg bg-phoebe-green px-6 py-3 text-sm font-semibold text-white hover:bg-phoebe-green-deep transition-colors">
          Réessayer
        </button>
        <Link href="/" className="rounded-lg border border-phoebe-anthracite/20 px-6 py-3 text-sm font-semibold text-phoebe-anthracite hover:bg-phoebe-pearl transition-colors">
          Accueil
        </Link>
      </div>
    </div>
  )
}
