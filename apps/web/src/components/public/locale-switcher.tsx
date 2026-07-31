"use client";

import { useTransition } from "react";
import { changerLangue } from "@/app/actions/langues";
import type { Langue } from "@/lib/langues";

interface LocaleSwitcherProps {
  langues: Langue[];
  current: string;
}

export function LocaleSwitcher({ langues, current }: LocaleSwitcherProps) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={current}
      onChange={(e) =>
        startTransition(() => changerLangue(e.target.value))
      }
      disabled={pending}
      className="cursor-pointer rounded-lg border border-public-border bg-public-bg/80 px-2 py-1 text-xs text-public-text-muted transition-colors hover:text-public-text focus:outline-none focus:ring-1 focus:ring-accent-gold/50"
    >
      {langues.map((l) => (
        <option key={l.code} value={l.code}>
          {l.drapeau ? `${l.drapeau} ` : ""}
          {l.nom}
        </option>
      ))}
    </select>
  );
}
