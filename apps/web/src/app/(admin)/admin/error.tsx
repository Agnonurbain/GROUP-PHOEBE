"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h2 className="mt-3 text-lg font-bold text-phoebe-anthracite">
        Erreur dans le back-office
      </h2>
      <p className="mt-1 text-sm text-phoebe-anthracite/60">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-xl bg-phoebe-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md"
      >
        Réessayer
      </button>
    </div>
  );
}
