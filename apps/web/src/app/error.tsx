"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h1 className="mt-4 text-xl font-bold text-phoebe-anthracite">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-sm text-phoebe-anthracite/70">
        Quelque chose s&apos;est mal passé. Veuillez réessayer ou revenir à la page précédente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-phoebe-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-phoebe-green-deep hover:shadow-md"
      >
        Réessayer
      </button>
    </div>
  );
}
