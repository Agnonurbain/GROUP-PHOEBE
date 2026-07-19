import Link from "next/link";
import { Header } from "@/components/header";

export default async function EchecPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center animate-fade-in">
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-error/10 blur-xl" />
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-phoebe-anthracite">
          Paiement non abouti
        </h1>
        <p className="mb-8 max-w-sm text-phoebe-anthracite/55 leading-relaxed">
          Le paiement a été annulé ou a échoué. Les disponibilités ont été
          libérées — vous pouvez réessayer à tout moment.
        </p>
        <Link
          href="/catalogue"
          className="relative overflow-hidden rounded-2xl bg-phoebe-green px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-lg"
        >
          <span className="relative z-10">Retour au catalogue</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
        </Link>
      </main>
    </>
  );
}
