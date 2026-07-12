import { Header } from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-phoebe-anthracite">
            GROUP <span className="text-phoebe-green">PHOEBE</span>
          </h1>
          <p className="mt-2 text-lg text-phoebe-anthracite/70">
            Transport &middot; Livraison &middot; Immobilier &middot; Assistance
            Voyages &amp; Études
          </p>
        </div>
      </main>
    </>
  );
}
