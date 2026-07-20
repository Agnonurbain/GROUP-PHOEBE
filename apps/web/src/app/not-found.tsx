import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <p className="text-6xl font-bold text-phoebe-gold">404</p>
      <h1 className="mt-4 text-xl font-bold text-phoebe-anthracite">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-phoebe-anthracite/50">
        La page que vous cherchez n&apos;existe pas ou vous n&apos;y avez pas accès.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-phoebe-green px-6 py-3 text-sm font-semibold text-white shadow-md shadow-phoebe-green/25 transition-all hover:bg-phoebe-green-deep"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
