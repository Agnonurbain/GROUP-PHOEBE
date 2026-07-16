"use client";

import { deconnexion } from "@/app/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) {
      e.preventDefault();
    }
  }

  return (
    <form action={deconnexion}>
      <button
        type="submit"
        onClick={handleClick}
        className={className}
      >
        Déconnexion
      </button>
    </form>
  );
}
