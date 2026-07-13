import Link from "next/link";
import { Header } from "@/components/header";

export default async function EchecPage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 text-5xl text-error">&#10007;</div>
        <h1 className="mb-2 text-2xl font-bold text-phoebe-anthracite">
          Paiement non abouti
        </h1>
        <p className="mb-6 text-phoebe-anthracite/70">
          Le paiement a été annulé ou a échoué. Les disponibilités ont été
          libérées — vous pouvez réessayer à tout moment.
        </p>
        <Link
          href="/catalogue"
          className="rounded-lg bg-phoebe-green px-4 py-2 text-sm font-medium text-white hover:bg-phoebe-green/90"
        >
          Retour au catalogue
        </Link>
      </main>
    </>
  );
}
