"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { CAT_LABELS } from "@/lib/constants";
import { ScrollReveal, MagneticButton } from "@/components/effects";


export function PanierContent() {
  const { items, removeItem, toggleChauffeur, updateQuantity, clearCart, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-phoebe-pearl bg-white py-20 text-center shadow-sm animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-phoebe-pearl/60">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-anthracite/25">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-semibold text-phoebe-anthracite">Votre panier est vide</p>
          <p className="mt-1 text-sm text-phoebe-anthracite/40">
            Ajoutez un véhicule depuis notre catalogue pour commencer.
          </p>
        </div>
        <Link
          href="/catalogue"
          className="relative overflow-hidden rounded-2xl bg-phoebe-green px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep hover:shadow-lg"
        >
          <span className="relative z-10">Parcourir le catalogue</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        {items.map((item, i) => (
          <ScrollReveal key={item.groupKey} variant="fade-up" delay={i * 0.08}>
          <div
            className="group relative flex gap-5 rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-phoebe-gold/20 overflow-hidden"
          >
            {/* Gold top-border reveal on hover */}
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-phoebe-gold/0 via-phoebe-gold to-phoebe-gold/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {/* Photo */}
            <Link
              href={`/catalogue/groupe/${encodeURIComponent(item.groupKey)}/choix`}
              className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-phoebe-pearl"
            >
              {item.photoUrl ? (
                <Image
                  src={item.photoUrl}
                  alt={`${item.marque} ${item.modele}`}
                  fill
                  sizes="128px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-phoebe-anthracite/30">
                  Pas de photo
                </div>
              )}
            </Link>

            {/* Details */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  href={`/catalogue/groupe/${encodeURIComponent(item.groupKey)}/choix`}
                  className="font-bold text-phoebe-anthracite transition-colors hover:text-phoebe-gold"
                >
                  {item.marque} {item.modele}
                  {item.quantite > 1 && (
                    <span className="ml-1.5 text-sm font-normal text-phoebe-anthracite/45">
                      &times;{item.quantite}
                    </span>
                  )}
                </Link>
                <p className="mt-0.5 text-xs text-phoebe-anthracite/45">
                  {CAT_LABELS[item.categorie] ?? item.categorie}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-phoebe-gold">
                  {item.prixJournalier.toLocaleString("fr-FR")} FCFA/jour
                  {item.quantite > 1 && " chacun"}
                </span>
                {item.chauffeurDisponible && (
                  <label className="flex items-center gap-1.5 text-phoebe-anthracite/55">
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
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.groupKey, item.quantite - 1)}
                    disabled={item.quantite <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-phoebe-anthracite/15 text-sm text-phoebe-anthracite transition-colors hover:border-phoebe-gold hover:text-phoebe-gold disabled:opacity-30"
                  >
                    &minus;
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-phoebe-anthracite">
                    {item.quantite}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.groupKey, item.quantite + 1)}
                    disabled={item.quantite >= item.maxDisponible}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-phoebe-anthracite/15 text-sm text-phoebe-anthracite transition-colors hover:border-phoebe-gold hover:text-phoebe-gold disabled:opacity-30"
                  >
                    +
                  </button>
                  <span className="text-[11px] text-phoebe-anthracite/40">
                    / {item.maxDisponible} dispo
                  </span>
                </div>
              )}
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeItem(item.groupKey)}
              className="self-start rounded-xl p-2 text-phoebe-anthracite/25 transition-all hover:bg-error/5 hover:text-error"
              aria-label={`Retirer ${item.marque} ${item.modele}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-phoebe-gold/20 bg-gradient-to-br from-phoebe-pearl to-phoebe-pearl-warm p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-phoebe-anthracite/55">
            {count} véhicule{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-medium text-error/70 transition-colors hover:text-error hover:underline"
          >
            Vider le panier
          </button>
        </div>
        <p className="mt-2 text-xs text-phoebe-anthracite/40 leading-relaxed">
          Le montant total sera calculé à l&apos;étape suivante selon les dates et la destination choisies.
        </p>
      </div>

      {/* CTA */}
      <ScrollReveal variant="fade-up" delay={0.2}>
        <MagneticButton className="w-full">
          <Link
            href="/panier/reserver"
            className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-r from-phoebe-gold to-phoebe-gold-dark py-4 text-center text-sm font-bold text-white shadow-md shadow-phoebe-gold/20 transition-all hover:shadow-xl hover:shadow-phoebe-gold/30 active:scale-[0.98]"
          >
            <span className="relative z-10">Finaliser la réservation</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </MagneticButton>
      </ScrollReveal>
    </div>
  );
}
