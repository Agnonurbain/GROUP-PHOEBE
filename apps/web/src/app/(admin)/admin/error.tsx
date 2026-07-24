"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui";

export default function AdminError({
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
      <p className="mt-2 text-sm text-phoebe-anthracite/70">
        Impossible de charger cette page. Veuillez réessayer.
      </p>
      <Button variant="admin" onClick={reset} className="mt-6">
        Réessayer
      </Button>
    </div>
  );
}
