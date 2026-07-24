"use client";
import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifierOtp, renvoyerCode, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { ScrollReveal } from "@/components/effects";

const RESEND_COOLDOWN = 60;

export default function VerifierOtpForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const next = searchParams.get("next") ?? "";
  const [state, action] = useActionState<AuthState, FormData>(verifierOtp, {});
  const [resendState, resendAction] = useActionState<AuthState, FormData>(renvoyerCode, {});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <ScrollReveal variant="scale-in">
      <div className="mb-8 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-green/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-public-text sm:text-3xl text-center">
        Verification du telephone
      </h1>
      <p className="mt-2 mb-8 text-center text-sm text-public-text-muted">
        Saisissez le code recu par SMS au{" "}
        <span className="font-semibold text-public-text">{phone}</span>
      </p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-3.5 text-sm text-accent-red">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <input type="hidden" name="phone" value={phone} />
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-public-text">
            Code de verification
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
            className="w-full rounded-xl border border-public-border bg-public-bg-card px-4 py-3.5 text-center text-xl font-semibold tracking-[0.5em] text-public-text placeholder:text-public-text-faint placeholder:tracking-[0.5em] transition-all duration-200 focus:border-accent-green focus:bg-public-bg focus:outline-none focus:ring-2 focus:ring-accent-green/20"
            placeholder="000000"
          />
        </div>
        <SubmitButton>Verifier</SubmitButton>
      </form>

      <div className="mt-6 text-center">
        {cooldown > 0 ? (
          <p className="text-xs text-public-text-faint">
            Renvoyer le code dans {cooldown}s
          </p>
        ) : (
          <form action={resendAction} onSubmit={() => setCooldown(RESEND_COOLDOWN)}>
            <input type="hidden" name="phone" value={phone} />
            <button
              type="submit"
              className="text-sm font-medium text-accent-green transition-colors hover:text-accent-green-hover hover:underline"
            >
              Renvoyer le code
            </button>
          </form>
        )}
        {resendState.error && (
          <p className="mt-2 text-xs text-accent-red">{resendState.error}</p>
        )}
        {resendState.phone === "resent" && (
          <p className="mt-2 text-xs text-accent-green">Nouveau code envoye !</p>
        )}
      </div>
    </ScrollReveal>
  );
}