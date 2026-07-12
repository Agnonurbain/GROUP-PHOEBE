"use client";

import { useTransition } from "react";
import {
  validerVerification,
  rejeterVerification,
} from "@/app/actions/admin";

export function VerificationActions({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            validerVerification(userId);
          })
        }
        className="rounded-lg bg-phoebe-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-phoebe-green-deep disabled:opacity-50"
      >
        Valider
      </button>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(() => {
            rejeterVerification(userId);
          })
        }
        className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:opacity-50"
      >
        Rejeter
      </button>
    </div>
  );
}
