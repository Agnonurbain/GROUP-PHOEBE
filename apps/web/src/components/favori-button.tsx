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
      className={`shrink-0 cursor-pointer rounded-full p-1.5 transition-all duration-150 hover:scale-110 active:scale-95 disabled:opacity-50 ${
        isFavori
          ? "text-error hover:text-error/70"
          : "text-phoebe-anthracite/70 hover:text-error"
      }`}
      aria-label={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isFavori ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
