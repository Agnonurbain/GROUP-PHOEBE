import Link from "next/link"

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl font-bold text-phoebe-gold">404</span>
      <h1 className="mt-4 text-2xl font-bold text-phoebe-anthracite">Page introuvable</h1>
      <p className="mt-2 text-sm text-phoebe-anthracite/55">Cette page du back-office n&apos;existe pas.</p>
      <Link href="/admin" className="mt-8 rounded-lg bg-phoebe-green px-6 py-3 text-sm font-semibold text-white hover:bg-phoebe-green-deep transition-colors">
        Retour au back-office
      </Link>
    </div>
  )
}
