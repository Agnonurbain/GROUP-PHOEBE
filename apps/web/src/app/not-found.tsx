import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <p className="text-[140px] font-bold leading-none tracking-tight text-[rgba(201,168,76,0.1)]">404</p>
      <div className="-mt-10 text-center">
        <h1 className="text-xl font-bold text-[#F5F5F5]">Page introuvable</h1>
        <p className="mt-2 text-sm text-public-text-muted">La page que vous cherchez n&apos;existe pas ou n&apos;est plus accessible.</p>
      </div>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0A0A0A] transition-all hover:bg-[#B8943A]"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
