import Link from "next/link"

export default function PublicNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl font-bold text-accent-gold">404</span>
      <h1 className="mt-4 text-4xl font-bold text-public-text">Page introuvable</h1>
      <p className="mt-2 text-sm text-public-text-muted">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" className="mt-8 rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover transition-colors">
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
