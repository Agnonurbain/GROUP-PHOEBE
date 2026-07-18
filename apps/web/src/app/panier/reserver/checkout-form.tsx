"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { creerReservationMultiple, type ReservationMultiState } from "@/app/actions/reservation-multi";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-lg border border-phoebe-anthracite/20 px-3 py-2 text-sm transition-colors focus:border-phoebe-green";

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

type Zone = { id: string; nom: string };
type Commune = { id: string; nom: string; zone_id: string };
type IntervallePrix = {
  id: string;
  zone_id: string;
  categorie_vehicule: string;
  prix_min: number;
  prix_max: number;
};

export function CheckoutForm({
  verifie,
  zones,
  communes,
  intervalles,
}: {
  verifie: boolean;
  zones: Zone[];
  communes: Commune[];
  intervalles: IntervallePrix[];
}) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [state, formAction] = useActionState<ReservationMultiState, FormData>(
    async (prev, fd) => {
      const result = await creerReservationMultiple(prev, fd);
      if (result.success) clearCart();
      return result;
    },
    {}
  );

  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [communeDepart, setCommuneDepart] = useState("");
  const [communeDest, setCommuneDest] = useState("");
  const [autreDepartNom, setAutreDepartNom] = useState("");
  const [autreDestNom, setAutreDestNom] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/panier");
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  const nbJours =
    debut && fin
      ? Math.max(
          1,
          Math.ceil(
            (new Date(fin).getTime() - new Date(debut).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const lignesCalc = items.map((item) => {
    const montant = item.prixJournalier * nbJours;
    const caution = Math.round(montant * item.tauxCaution);
    return { ...item, montant, caution, total: montant + caution };
  });

  const totalMontant = lignesCalc.reduce((s, l) => s + l.montant, 0);
  const totalCaution = lignesCalc.reduce((s, l) => s + l.caution, 0);
  const grandTotal = totalMontant + totalCaution;

  const communesByZone = zones.map((z) => ({
    ...z,
    communes: communes.filter((c) => c.zone_id === z.id),
  }));

  const selectedDestCommune = communes.find((c) => c.id === communeDest);
  const destZone = selectedDestCommune
    ? zones.find((z) => z.id === selectedDestCommune.zone_id)
    : null;

  const lignesJson = JSON.stringify(
    items.map((i) => ({
      vehiculeId: i.vehiculeId,
      avecChauffeur: i.avecChauffeur,
    }))
  );

  return (
    <>
      {state.error && (
        <div className="mb-6 animate-fade-in rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="lignes" value={lignesJson} />

        {/* Recap véhicules */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-phoebe-anthracite">
            Véhicules sélectionnés ({items.length})
          </h2>
          <div className="space-y-2">
            {lignesCalc.map((item) => (
              <div
                key={item.vehiculeId}
                className="flex items-center gap-3 rounded-xl border border-phoebe-pearl bg-white p-3"
              >
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-phoebe-pearl">
                  {item.photoUrl ? (
                    <Image
                      src={item.photoUrl}
                      alt={`${item.marque} ${item.modele}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[9px] text-phoebe-anthracite/30">
                      —
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-phoebe-anthracite">
                    {item.marque} {item.modele}
                  </p>
                  <p className="text-xs text-phoebe-anthracite/50">
                    {CAT_LABELS[item.categorie] ?? item.categorie}
                    {item.avecChauffeur && " · Avec chauffeur"}
                  </p>
                </div>
                {nbJours > 0 && (
                  <span className="text-sm font-medium text-phoebe-green">
                    {item.montant.toLocaleString("fr-FR")} FCFA
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Période */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Période de location
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ck-debut" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Date de début *
              </label>
              <input
                id="ck-debut"
                type="date"
                name="debut"
                required
                min={today}
                value={debut}
                onChange={(e) => setDebut(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ck-fin" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Date de fin *
              </label>
              <input
                id="ck-fin"
                type="date"
                name="fin"
                required
                min={debut || today}
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>

        {/* Trajet */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Trajet
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ck-commune-depart" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Commune de départ
              </label>
              <select
                id="ck-commune-depart"
                name="ville_depart"
                value={communeDepart}
                onChange={(e) => setCommuneDepart(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.nom}>{c.nom}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDepart === "autre" && (
                <input
                  name="ville_depart_autre"
                  placeholder="Nom de votre commune"
                  value={autreDepartNom}
                  onChange={(e) => setAutreDepartNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
            <div>
              <label htmlFor="ck-commune-dest" className="mb-1 block text-sm font-medium text-phoebe-anthracite">
                Commune de destination
              </label>
              <select
                id="ck-commune-dest"
                name="destination"
                value={communeDest}
                onChange={(e) => setCommuneDest(e.target.value)}
                className={inputClass}
              >
                <option value="">Sélectionner une commune</option>
                {communesByZone.map((z) => (
                  <optgroup key={z.id} label={z.nom}>
                    {z.communes.map((c) => (
                      <option key={c.id} value={c.nom}>{c.nom}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="autre">Autre commune...</option>
              </select>
              {communeDest === "autre" && (
                <input
                  name="destination_autre"
                  placeholder="Nom de votre commune"
                  value={autreDestNom}
                  onChange={(e) => setAutreDestNom(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>
          </div>

          {destZone && communeDest !== "autre" && (
            <div className="rounded-lg bg-phoebe-green/5 px-4 py-3">
              <p className="text-sm text-phoebe-anthracite/60">
                Zone tarifaire :{" "}
                <span className="font-medium text-phoebe-green-deep">
                  {destZone.nom}
                </span>
              </p>
            </div>
          )}
        </fieldset>

        {/* Récapitulatif financier */}
        {nbJours > 0 && (
          <div className="rounded-xl bg-phoebe-pearl p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
              Récapitulatif
            </h3>
            <dl className="space-y-1 text-sm">
              {lignesCalc.map((l) => (
                <div key={l.vehiculeId} className="flex justify-between">
                  <dt className="text-phoebe-anthracite/60">
                    {l.marque} {l.modele} ({nbJours}j)
                  </dt>
                  <dd className="font-medium text-phoebe-anthracite">
                    {l.montant.toLocaleString("fr-FR")} FCFA
                  </dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-1">
                <dt className="text-phoebe-anthracite/60">Sous-total location</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {totalMontant.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-phoebe-anthracite/60">Caution globale</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {totalCaution.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-1">
                <dt className="font-semibold text-phoebe-anthracite">Total à payer</dt>
                <dd className="font-bold text-phoebe-green">
                  {grandTotal.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-phoebe-anthracite/40">
              Le tarif final peut varier selon la négociation. La caution est restituée au retour des véhicules.
            </p>
          </div>
        )}

        {/* Paiement */}
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold text-phoebe-anthracite">
            Moyen de paiement *
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="radio"
                name="methode_paiement"
                value="cinetpay"
                defaultChecked
                className="text-phoebe-green focus:ring-phoebe-green"
              />
              Mobile Money (CinetPay)
            </label>
            <label className="flex items-center gap-2 text-sm text-phoebe-anthracite">
              <input
                type="radio"
                name="methode_paiement"
                value="stripe"
                className="text-phoebe-green focus:ring-phoebe-green"
              />
              Carte bancaire (Stripe)
            </label>
          </div>
        </fieldset>

        {!verifie ? (
          <div className="rounded-lg bg-phoebe-gold/10 px-4 py-3 text-sm text-phoebe-gold">
            Votre identité n&apos;est pas encore vérifiée. Vous devez soumettre vos
            documents depuis votre profil avant de pouvoir réserver.
          </div>
        ) : (
          <SubmitButton>Procéder au paiement — {grandTotal > 0 ? `${grandTotal.toLocaleString("fr-FR")} FCFA` : ""}</SubmitButton>
        )}
      </form>
    </>
  );
}
