"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { connexion, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { GoogleButton } from "@/components/google-button";

export default function ConnexionPage() {
  const [state, action] = useActionState<AuthState, FormData>(connexion, {});
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "";

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold text-phoebe-anthracite">
        Connexion
      </h1>

      {state.error && (
        <div className="animate-fade-in mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <GoogleButton label="Se connecter avec Google" />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-phoebe-anthracite/15" />
        <span className="text-xs text-phoebe-anthracite/40">ou</span>
        <div className="h-px flex-1 bg-phoebe-anthracite/15" />
      </div>

      <form action={action} className="space-y-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
        <div>
          <label htmlFor="identifiant" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Telephone ou email
          </label>
          <input
            id="identifiant"
            name="identifiant"
            type="text"
            required
            className="w-full rounded-lg border border-phoebe-anthracite/20 px-4 py-2.5 text-sm transition-colors focus:border-phoebe-green"
            placeholder="+225 XX XX XX XX XX ou email"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
            Mot de passe
          </label>
          <PasswordInput id="password" name="password" required placeholder="Mot de passe" />
        </div>

        <SubmitButton>Se connecter</SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/mot-de-passe-oublie"
          className="text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          Mot de passe oublié&nbsp;?
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-phoebe-anthracite/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-phoebe-green hover:text-phoebe-green-deep">
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}
