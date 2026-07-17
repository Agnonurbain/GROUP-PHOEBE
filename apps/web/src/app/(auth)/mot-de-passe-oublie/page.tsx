"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { envoyerCodeReset, envoyerResetEmail, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

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
    <>
      <h1 className="mb-2 text-center text-xl font-bold text-phoebe-anthracite">
        Mot de passe oublié
      </h1>
      <p className="mb-6 text-center text-sm text-phoebe-anthracite/60">
        {mode === "phone"
          ? "Saisissez votre numéro de téléphone pour recevoir un code de réinitialisation par SMS."
          : "Saisissez votre adresse email pour recevoir un lien de réinitialisation."}
      </p>

      {state.error && (
        <div className="animate-fade-in mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      {emailState.phone === "sent" && mode === "email" && (
        <div className="animate-fade-in mb-4 rounded-lg bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("phone")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "phone"
              ? "bg-phoebe-green text-white"
              : "bg-phoebe-pearl text-phoebe-anthracite/60 hover:bg-phoebe-pearl/80"
          }`}
        >
          Par SMS
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            mode === "email"
              ? "bg-phoebe-green text-white"
              : "bg-phoebe-pearl text-phoebe-anthracite/60 hover:bg-phoebe-pearl/80"
          }`}
        >
          Par email
        </button>
      </div>

      <form action={action} className="space-y-4">
        {mode === "phone" ? (
          <div>
            <label
              htmlFor="telephone"
              className="mb-1 block text-sm font-medium text-phoebe-anthracite"
            >
              Téléphone
            </label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              required
              autoFocus
              className="w-full rounded-lg border border-phoebe-anthracite/20 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
              placeholder="+225 XX XX XX XX XX"
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-phoebe-anthracite"
            >
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-lg border border-phoebe-anthracite/20 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
              placeholder="votre@email.com"
            />
          </div>
        )}

        <SubmitButton>
          {mode === "phone" ? "Envoyer le code" : "Envoyer le lien"}
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-phoebe-anthracite/60">
        <Link
          href="/connexion"
          className="font-medium text-phoebe-green hover:text-phoebe-green-deep"
        >
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
