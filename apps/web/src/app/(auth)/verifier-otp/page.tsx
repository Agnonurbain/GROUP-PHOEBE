"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { verifierOtp, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

function OtpForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const next = searchParams.get("next") ?? "";
  const [state, action] = useActionState<AuthState, FormData>(verifierOtp, {});

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold text-phoebe-anthracite">
        Vérification du téléphone
      </h1>
      <p className="mb-6 text-center text-sm text-phoebe-anthracite/60">
        Saisissez le code reçu par SMS au{" "}
        <span className="font-medium">{phone}</span>
      </p>

      {state.error && (
        <div className="animate-fade-in mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="phone" value={phone} />
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Code de vérification
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-lg tracking-[0.5em] transition-colors focus:border-phoebe-green"
            placeholder="000000"
          />
        </div>
        <SubmitButton>Vérifier</SubmitButton>
      </form>
    </>
  );
}

export default function VerifierOtpPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-phoebe-anthracite/60">
          Chargement…
        </p>
      }
    >
      <OtpForm />
    </Suspense>
  );
}
