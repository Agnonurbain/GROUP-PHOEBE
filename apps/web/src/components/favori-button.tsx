"use client";

import { useTransition } from "react";
import { toggleFavori } from "@/app/actions/favoris";

export function FavoriButton({
  vehiculeId,
  isFavori,
}: {
  vehiculeId: string;
  isFavori: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleFavori(vehiculeId);
        })
      }
      className={`shrink-0 rounded-full p-1.5 text-lg transition-colors disabled:opacity-50 ${
        isFavori
          ? "text-error hover:text-error/70"
          : "text-phoebe-anthracite/30 hover:text-error"
      }`}
      title={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFavori ? "♥" : "♡"}
    </button>
  );
}
