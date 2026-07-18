"use client";

import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AjouterPanierButton({
  vehicule,
}: {
  vehicule: Omit<CartItem, "avecChauffeur">;
}) {
  const { addItem, isInCart, removeItem } = useCart();
  const router = useRouter();
  const inCart = isInCart(vehicule.vehiculeId);

  if (inCart) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl bg-phoebe-green/10 px-4 py-3 text-sm text-phoebe-green-deep">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Véhicule dans le panier
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/panier")}
            className="flex-1 rounded-xl bg-phoebe-green py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md active:scale-[0.98]"
          >
            Voir le panier
          </button>
          <button
            type="button"
            onClick={() => removeItem(vehicule.vehiculeId)}
            className="rounded-xl border border-error/20 px-4 py-3 text-sm text-error transition-colors hover:bg-error/5"
          >
            Retirer
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(vehicule)}
      className="block w-full rounded-xl bg-phoebe-green py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md active:scale-[0.98]"
    >
      Ajouter au panier
    </button>
  );
}
