export default function Home() {
  return (
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
      <div className="flex gap-4">
        <span className="rounded-full bg-phoebe-green px-4 py-2 text-sm font-medium text-white">
          Vert Phoebe
        </span>
        <span className="rounded-full bg-phoebe-green-deep px-4 py-2 text-sm font-medium text-white">
          Vert profond
        </span>
        <span className="rounded-full bg-phoebe-gold px-4 py-2 text-sm font-medium text-white">
          Or Phoebe
        </span>
        <span className="rounded-full bg-phoebe-pearl px-4 py-2 text-sm font-medium text-phoebe-anthracite">
          Gris perle
        </span>
      </div>
    </main>
  );
}
