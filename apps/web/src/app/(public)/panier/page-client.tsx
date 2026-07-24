"use client"

import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { PanierStepper } from "@/components/panier-stepper"
import { BackLink } from "@/components/public/back-link"
import { Badge, Button, Card } from "@/components/ui"
import { trackEvent } from "@/lib/analytics"
import { useEffect } from "react"

export default function Panier() {
  const { items, removeItem, updateQuantity, toggleChauffeur, clearCart, count } = useCart()

  useEffect(() => {
    if (items.length > 0) {
      trackEvent("view_cart", {
        currency: "XOF",
        value: items.reduce((sum, i) => sum + i.prixJournalier * i.quantite, 0),
        items: items.map((i) => ({
          item_id: i.groupKey,
          item_name: `${i.marque} ${i.modele}`,
          item_category: i.categorie,
          price: i.prixJournalier,
          currency: "XOF",
          quantity: i.quantite,
          item_brand: i.marque,
        })),
      });
    }
  }, [items]);

  const montantLocation = items.reduce(
    (sum, i) => sum + i.prixJournalier * i.quantite,
    0
  )
  const cautionTotale = items.reduce(
    (sum, i) => sum + i.cautionBaseFcfa * i.quantite,
    0
  )
  const total = montantLocation + cautionTotale

  if (count === 0) {
    return (
      <>
        <PanierStepper current={0} />
        <div className="flex flex-col items-center gap-6 px-6 py-20">
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="text-public-text-faint">
            <path d="M80 15L140 50V95L80 120L20 95V50L80 15Z" fill="currentColor" fillOpacity="0.08" />
            <path d="M80 15L140 50V95L80 120L20 95V50L80 15Z" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
            <path d="M80 15L140 50M80 15L20 50M80 15V55M140 50L80 55M140 50V95L80 120M20 50V95L80 120M80 95V120M80 95L20 75M80 95L140 75" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
            <rect x="60" y="35" width="40" height="30" rx="3" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
            <rect x="72" y="30" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.2" />
            <circle cx="80" cy="50" r="4" fill="currentColor" fillOpacity="0.15" />
            <path d="M60 65L45 72M100 65L115 72M45 72L80 90L115 72" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
            <rect x="68" y="55" width="8" height="12" rx="1" fill="currentColor" fillOpacity="0.1" />
            <rect x="80" y="58" width="8" height="10" rx="1" fill="currentColor" fillOpacity="0.08" />
          </svg>
          <h2 className="text-3xl font-semibold text-public-text">Votre panier est vide</h2>
          <p className="text-sm text-public-text-muted">Parcourez notre catalogue pour ajouter des véhicules.</p>
          <Link
            href="/transport/catalogue"
            className="rounded-lg bg-accent-orange px-6 py-3 text-sm font-semibold text-white hover:bg-accent-orange-hover transition-colors"
          >
            Voir le catalogue
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PanierStepper current={0} />

      <div className="px-6 pt-6">
        <BackLink href="/transport/catalogue" label="Retour au catalogue" />
      </div>

      <div className="flex items-center justify-between px-6 py-8">
        <h1 className="text-4xl font-bold text-public-text">Panier ({count} véhicule{count > 1 ? "s" : ""})</h1>
        <Button
          variant="text-link"
          onClick={clearCart}
          className="text-[#EF4444] hover:text-[#DC2626]"
        >
          Vider le panier
        </Button>
      </div>

      <div className="grid gap-12 px-6 pb-20 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {items.map((item) => (
            <Card key={item.groupKey} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-public-text">{item.marque} {item.modele}</h3>
                    <Badge variant="green">{item.categorie}</Badge>
                  </div>
                  <p className="mt-1 text-3xl font-bold text-public-text-muted">
                    {item.prixJournalier.toLocaleString()} FCFA/jour
                    {item.cautionBaseFcfa > 0 && ` · Caution: ${item.cautionBaseFcfa.toLocaleString()} FCFA`}
                  </p>
                </div>
                <Button
                  variant="icon"
                  onClick={() => removeItem(item.groupKey)}
                  className="text-[#6B7280] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#EF4444]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.groupKey, item.quantite - 1)}
                    disabled={item.quantite <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2A2A2A] text-public-text-muted hover:border-[#F97316]/30 hover:text-public-text disabled:opacity-30 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-public-text">{item.quantite}</span>
                  <button
                    onClick={() => updateQuantity(item.groupKey, item.quantite + 1)}
                    disabled={item.quantite >= item.maxDisponible}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2A2A2A] text-public-text-muted hover:border-[#F97316]/30 hover:text-public-text disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>

                {item.chauffeurDisponible && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-public-text-muted">
                    <input
                      type="checkbox"
                      checked={item.avecChauffeur}
                      onChange={() => toggleChauffeur(item.groupKey)}
                      className="h-4 w-4 rounded border-[#2A2A2A] bg-[#0A0A0A] text-[#F97316] focus:ring-[#F97316]"
                    />
                    Avec chauffeur
                  </label>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#2A2A2A] pt-3">
                <span className="text-sm text-public-text-muted">Sous-total</span>
                <span className="text-3xl font-bold text-public-text">
                  {(item.prixJournalier * item.quantite).toLocaleString()} FCFA
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <h2 className="text-3xl font-semibold text-public-text">Récapitulatif</h2>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-public-text-muted">Location ({count} véhicule{count > 1 ? "s" : ""})</span>
                <span className="text-3xl font-bold text-public-text">{montantLocation.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-public-text-muted">Caution totale</span>
                <span className="text-3xl font-bold text-public-text">{cautionTotale.toLocaleString()} FCFA</span>
              </div>
              <p className="text-sm text-[#6B7280]">(Caution remboursable sous 72h après restitution)</p>
              <hr className="border-[#2A2A2A]" />
              <div className="flex justify-between">
                <span className="text-sm font-bold text-public-text">Total à payer</span>
                <span className="text-3xl font-bold text-[#F97316]">{total.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#6B7280]">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Annulation gratuite
              </span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Support 24/7
              </span>
            </div>

            <div className="mt-6">
              <p className="text-sm text-public-text-muted">Moyens de paiement</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Orange Money", "MTN MoMo", "Wave", "Carte Bancaire"].map((m) => (
                  <span key={m} className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-[11px] text-public-text-muted">{m}</span>
                ))}
              </div>
            </div>

            <Link
              href="/panier/paiement"
              className="mt-6 flex w-full"
            >
              <Button variant="orange" size="lg" className="w-full">
                Continuer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}