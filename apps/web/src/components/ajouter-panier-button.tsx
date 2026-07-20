"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AjouterPanierButton({
  vehicule,
}: {
  vehicule: Omit<CartItem, "avecChauffeur">;
}) {
  const { addItem, isInCart, removeItem, getQuantity, updateQuantity } = useCart();
  const router = useRouter();
  const inCart = isInCart(vehicule.groupKey);
  const currentQty = getQuantity(vehicule.groupKey);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const max = vehicule.maxDisponible;

  const handleAdd = useCallback(() => {
    setLoading(true);
    addItem({ ...vehicule, quantite: qty });
    setAdded(true);
    setLoading(false);
    setTimeout(() => setAdded(false), 2000);
  }, [addItem, vehicule, qty]);

  if (inCart) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-phoebe-green/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-phoebe-green-deep">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Dans le panier
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateQuantity(vehicule.groupKey, currentQty - 1)}
              disabled={currentQty <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-phoebe-green/30 text-phoebe-green-deep disabled:opacity-30"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-phoebe-green-deep">
              {currentQty}
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(vehicule.groupKey, currentQty + 1)}
              disabled={currentQty >= max}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-phoebe-green/30 text-phoebe-green-deep disabled:opacity-30"
            >
              +
            </button>
          </div>
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
            onClick={() => removeItem(vehicule.groupKey)}
            className="rounded-xl border border-error/20 px-4 py-3 text-sm text-error transition-colors hover:bg-error/5"
          >
            Retirer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {max > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-phoebe-pearl px-4 py-3">
          <span className="text-sm text-phoebe-anthracite/60">Quantité</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-phoebe-anthracite/20 text-phoebe-anthracite disabled:opacity-30"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-bold text-phoebe-anthracite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(max, q + 1))}
              disabled={qty >= max}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-phoebe-anthracite/20 text-phoebe-anthracite disabled:opacity-30"
            >
              +
            </button>
            <span className="ml-1 text-xs text-phoebe-anthracite/40">
              / {max} dispo
            </span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading}
        className={`block w-full rounded-xl py-3 text-center text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 ${
          added
            ? "bg-phoebe-green-deep text-white shadow-md"
            : "bg-phoebe-green text-white hover:bg-phoebe-green-deep hover:shadow-md"
        }`}
      >
        {loading
          ? "⏳ Ajout en cours..."
          : added
            ? "✅ Ajouté au panier !"
            : `Je réserve ce véhicule${qty > 1 ? ` (${qty})` : ""}`}
      </button>
    </div>
  );
}
