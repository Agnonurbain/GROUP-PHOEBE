"use client";

import { useState } from "react";

export function PasswordInput({
  id,
  name,
  placeholder,
  required,
  minLength,
  autoFocus,
  autoComplete,
  variant = "light",
}: {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  autoComplete?: string;
  /** "light" pour les pages auth (fond clair), "dark" pour le profil (fond sombre). */
  variant?: "light" | "dark";
}) {
  const [visible, setVisible] = useState(false);

  const inputClass =
    variant === "dark"
      ? "w-full rounded-xl border border-public-border bg-public-bg px-4 py-3 pr-11 text-sm text-public-text placeholder:text-public-text-faint transition-all duration-200 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
      : "w-full rounded-xl border border-phoebe-anthracite/15 bg-phoebe-pearl/30 px-4 py-3 pr-11 text-sm text-phoebe-anthracite placeholder:text-phoebe-anthracite/70 transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/20";

  const toggleClass =
    variant === "dark"
      ? "absolute right-3 top-1/2 -translate-y-1/2 text-public-text-muted transition-colors hover:text-public-text"
      : "absolute right-3 top-1/2 -translate-y-1/2 text-phoebe-anthracite/70 transition-colors hover:text-phoebe-anthracite";

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={inputClass}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={toggleClass}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}
