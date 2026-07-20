"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { envoyerCodeReset, envoyerResetEmail, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { ScrollReveal } from "@/components/effects";

export default function MotDePasseOubliePage() {
  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [phoneState, phoneAction] = useActionState<AuthState, FormData>(
    envoyerCodeReset,
    {}
  );
  const [emailState, emailAction] = useActionState<AuthState, FormData>(
    envoyerResetEmail,
    {}
  );

  const state = mode === "phone" ? phoneState : emailState;
  const action = mode === "phone" ? phoneAction : emailAction;

  return (
    <ScrollReveal variant="scale-in">
      <h1 className="text-2xl font-bold tracking-tight text-phoebe-anthracite sm:text-3xl">
        Mot de passe oublie
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-phoebe-anthracite/60">
        {mode === "phone"
          ? "Saisissez votre numero de telephone pour recevoir un code de reinitialisation par SMS."
          : "Saisissez votre adresse email pour recevoir un lien de reinitialisation."}
      </p>

      {state.error && (
        <div className="animate-fade-in mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3.5 text-sm text-error">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
          </svg>
          {state.error}
        </div>
      )}

      {emailState.phone === "sent" && mode === "email" && (
        <div className="animate-fade-in mb-6 rounded-xl border border-phoebe-green/20 bg-phoebe-green/5 px-4 py-3.5 text-sm text-phoebe-green-deep">
          Un email de reinitialisation a ete envoye. Verifiez votre boite de reception.
        </div>
      )}

      <div className="mb-6 flex gap-2 rounded-xl bg-phoebe-pearl/50 p-1">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            mode === "phone"
              ? "bg-phoebe-green text-white shadow-md shadow-phoebe-green/25"
              : "text-phoebe-anthracite/60 hover:text-phoebe-anthracite"
          }`}
        >
          Par SMS
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            mode === "email"
              ? "bg-phoebe-green text-white shadow-md shadow-phoebe-green/25"
              : "text-phoebe-anthracite/60 hover:text-phoebe-anthracite"
          }`}
        >
          Par email
        </button>
      </div>

      <form action={action} className="space-y-5">
        {mode === "phone" ? (
          <div>
            <label
              htmlFor="telephone"
              className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
            >
              Telephone
            </label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              required
              autoFocus
              inputMode="numeric"
              pattern="[+][0-9]{7,15}"
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/35 transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder="+225 XX XX XX XX XX"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-phoebe-anthracite"
            >
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/35 transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/20"
              placeholder="votre@email.com"
            />
          </div>
        )}

        <SubmitButton>
          {mode === "phone" ? "Envoyer le code" : "Envoyer le lien"}
        </SubmitButton>
      </form>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-phoebe-anthracite/10" />
        <div className="h-px flex-1 bg-phoebe-anthracite/10" />
      </div>

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/60">
        <Link
          href="/connexion"
          className="font-semibold text-phoebe-green transition-colors duration-200 hover:text-phoebe-green-deep"
        >
          Retour a la connexion
        </Link>
      </p>
    </ScrollReveal>
  );
}
