"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-error/15 blur-xl" />
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-bold text-phoebe-anthracite">
        Erreur dans le back-office
      </h2>
      <p className="mt-2 text-sm text-phoebe-anthracite/55">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-phoebe-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
      >
        Réessayer
      </button>
    </div>
  );
}
