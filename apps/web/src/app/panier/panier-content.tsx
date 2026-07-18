"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

export function PanierContent() {
  const { items, removeItem, toggleChauffeur, updateQuantity, clearCart, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-anthracite/20">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p className="text-phoebe-anthracite/50">Votre panier est vide.</p>
        <Link
          href="/catalogue"
          className="rounded-xl bg-phoebe-green px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md"
        >
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.groupKey}
            className="flex gap-4 rounded-xl border border-phoebe-pearl bg-white p-4 shadow-sm"
          >
            {/* Photo */}
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-phoebe-pearl">
              {item.photoUrl ? (
                <Image
                  src={item.photoUrl}
                  alt={`${item.marque} ${item.modele}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-phoebe-anthracite/30">
                  Pas de photo
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3 className="font-semibold text-phoebe-anthracite">
                  {item.marque} {item.modele}
                  {item.quantite > 1 && (
                    <span className="ml-1.5 text-sm font-normal text-phoebe-anthracite/50">
                      &times;{item.quantite}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-phoebe-anthracite/50">
                  {CAT_LABELS[item.categorie] ?? item.categorie}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-phoebe-green">
                  {item.prixJournalier.toLocaleString("fr-FR")} FCFA/jour
                  {item.quantite > 1 && " chacun"}
                </span>
                {item.chauffeurDisponible && (
                  <label className="flex items-center gap-1.5 text-phoebe-anthracite/70">
                    <input
                      type="checkbox"
                      checked={item.avecChauffeur}
                      onChange={() => toggleChauffeur(item.groupKey)}
                      className="rounded border-phoebe-anthracite/30 text-phoebe-green focus:ring-phoebe-green"
                    />
                    Chauffeur
                  </label>
                )}
              </div>
              {/* Quantity stepper */}
              {item.maxDisponible > 1 && (
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.groupKey, item.quantite - 1)}
                    disabled={item.quantite <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded border border-phoebe-anthracite/20 text-xs text-phoebe-anthracite disabled:opacity-30"
                  >
                    &minus;
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-phoebe-anthracite">
                    {item.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.groupKey, item.quantite + 1)}
                    disabled={item.quantite >= item.maxDisponible}
                    className="flex h-6 w-6 items-center justify-center rounded border border-phoebe-anthracite/20 text-xs text-phoebe-anthracite disabled:opacity-30"
                  >
                    +
                  </button>
                  <span className="text-[10px] text-phoebe-anthracite/40">
                    / {item.maxDisponible} dispo
                  </span>
                </div>
              )}
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeItem(item.groupKey)}
              className="self-start rounded-lg p-1.5 text-phoebe-anthracite/30 transition-colors hover:bg-error/5 hover:text-error"
              aria-label={`Retirer ${item.marque} ${item.modele}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-phoebe-pearl p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-phoebe-anthracite/60">
            {count} véhicule{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-error hover:underline"
          >
            Vider le panier
          </button>
        </div>
        <p className="mt-1 text-xs text-phoebe-anthracite/40">
          Le montant total sera calculé à l&apos;étape suivante selon les dates et la destination choisies.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/panier/reserver"
        className="block w-full rounded-xl bg-phoebe-green py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-md active:scale-[0.98]"
      >
        Finaliser la réservation
      </Link>
    </div>
  );
}
