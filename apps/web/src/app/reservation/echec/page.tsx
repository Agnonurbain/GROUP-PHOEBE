import Link from "next/link";
import { Header } from "@/components/header";

export default async function EchecPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-phoebe-anthracite">
          Paiement non abouti
        </h1>
        <p className="mb-6 text-phoebe-anthracite/70">
          Le paiement a été annulé ou a échoué. Les disponibilités ont été
          libérées — vous pouvez réessayer à tout moment.
        </p>
        <Link
          href="/catalogue"
          className="rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
        >
          Retour au catalogue
        </Link>
      </main>
    </>
  );
}
