"use client";

import { useTransition } from "react";
import { supprimerCategorie } from "@/app/actions/blog";

export function SupprimerCategorieButton({
  id,
  nom,
}: {
  id: string;
  nom: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Supprimer la catégorie « ${nom} » ?`)) {
          startTransition(async () => {
            await supprimerCategorie(id);
          });
        }
      }}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-error transition-all hover:bg-error/10"
    >
      {pending ? "…" : "Supprimer"}
    </button>
  );
}
