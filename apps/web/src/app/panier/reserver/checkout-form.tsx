"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { creerReservationMultiple, type ReservationMultiState } from "@/app/actions/reservation-multi";
import { creerDemandeNegociation, type NegociationState } from "@/app/actions/negociation";
import { SubmitButton } from "@/components/submit-button";
import { CommuneSearch } from "@/components/commune-search";
import { CAT_LABELS } from "@/lib/constants";

const inputClass =
  "w-full rounded-xl border border-phoebe-anthracite/12 bg-phoebe-pearl/20 px-4 py-2.5 text-sm text-phoebe-anthracite transition-all duration-200 focus:border-phoebe-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-phoebe-green/15";


type Zone = {
  id: string;
  nom: string;
  coefficient_majoration: number;
  caution_multiplicateur: number;
  km_inclus_par_jour: number;
  supplement_km_fcfa: number;
  chauffeur_statut: string;
  tarif_chauffeur_journalier: number;
};
type Commune = { id: string; nom: string; zone_id: string };
type IntervallePrix = {
  id: string;
  zone_id: string;
  categorie_vehicule: string;
  prix_min: number;
  prix_max: number;
};

export function CheckoutForm({
  zones,
  communes,
  intervalles,
}: {
  zones: Zone[];
  communes: Commune[];
  intervalles: IntervallePrix[];
}) {
  const router = useRouter();
  const { items, clearCart, count } = useCart();
  const [state, formAction] = useActionState<ReservationMultiState, FormData>(
    async (prev, fd) => {
      const result = await creerReservationMultiple(prev, fd);
      if (result.success) clearCart();
      return result;
    },
    {}
  );

  const [negoState, negoAction] = useActionState<NegociationState, FormData>(
    async (prev, fd) => {
      const result = await creerDemandeNegociation(prev, fd);
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
  const [showNego, setShowNego] = useState(false);
  const [negoNote, setNegoNote] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (items.length === 0 && !negoState.success) {
      router.replace("/panier");
    }
  }, [items.length, router, negoState.success]);

  if (negoState.success) {
    const whatsappUrl = `https://wa.me/2250778631983?text=${encodeURIComponent(
      `Bonjour, je souhaite négocier le prix de ma réservation (réf: ${negoState.demandeId?.slice(0, 8) ?? ""}). ${negoNote || ""}`
    )}`;
    return (
      <div className="space-y-6 text-center py-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-phoebe-green/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-green">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-phoebe-anthracite">Demande de négociation envoyée</h2>
        <p className="text-sm text-phoebe-anthracite/60">
          Votre réservation a été créée avec le statut « en négociation ».
          Les véhicules sont bloqués pour vous. Un opérateur vous enverra le prix final.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1da851] hover:shadow-md"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Négocier via WhatsApp
        </a>
        <a
          href="/profil/reservations"
          className="block text-sm text-phoebe-green hover:underline"
        >
          Voir mes réservations
        </a>
      </div>
    );
  }

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

  const selectedDestCommune = communes.find((c) => c.nom === communeDest);
  const destZone = selectedDestCommune
    ? zones.find((z) => z.id === selectedDestCommune.zone_id)
    : null;

  const coeff = destZone?.coefficient_majoration ?? 1;
  const cautionMult = destZone?.caution_multiplicateur ?? 1;
  const chauffeurStatut = destZone?.chauffeur_statut ?? "optionnel";
  const tarifChauffeur = destZone?.tarif_chauffeur_journalier ?? 0;

  const lignesCalc = items.map((item) => {
    const prixZone = Math.round(item.prixJournalier * coeff);
    const montantLocation = prixZone * nbJours * item.quantite;
    const chauffeurObligatoire = chauffeurStatut === "obligatoire";
    const avecChauffeurEffectif = item.avecChauffeur || chauffeurObligatoire;
    const montantChauffeur = avecChauffeurEffectif ? tarifChauffeur * nbJours * item.quantite : 0;
    const montant = montantLocation + montantChauffeur;
    const cautionBase = item.cautionBaseFcfa || Math.round(montantLocation * 0.3);
    const caution = Math.round(cautionBase * cautionMult) * item.quantite;
    return { ...item, prixZone, montant, montantLocation, montantChauffeur, caution, avecChauffeurEffectif, total: montant + caution };
  });

  const totalMontant = lignesCalc.reduce((s, l) => s + l.montant, 0);
  const totalCaution = lignesCalc.reduce((s, l) => s + l.caution, 0);
  const grandTotal = totalMontant + totalCaution;

  const communeOptions = communes.map((c) => ({
    id: c.id,
    nom: c.nom,
    zoneNom: zones.find((z) => z.id === c.zone_id)?.nom ?? "",
  }));

  const lignesJson = JSON.stringify(
    items.map((i) => ({
      groupKey: i.groupKey,
      marque: i.marque,
      modele: i.modele,
      quantite: i.quantite,
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
            Véhicules sélectionnés ({count})
          </h2>
          <div className="space-y-2">
            {lignesCalc.map((item) => (
              <div
                key={item.groupKey}
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
                      &mdash;
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-phoebe-anthracite">
                    {item.marque} {item.modele}
                    {item.quantite > 1 && (
                      <span className="ml-1 text-phoebe-anthracite/50">&times;{item.quantite}</span>
                    )}
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
                min={debut ? new Date(new Date(debut).getTime() + 86400000).toISOString().split("T")[0] : today}
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
              <CommuneSearch
                id="ck-commune-depart"
                name="ville_depart"
                value={communeDepart}
                onChange={setCommuneDepart}
                communes={communeOptions}
                placeholder="Rechercher une commune…"
                className={inputClass}
              />
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
              <CommuneSearch
                id="ck-commune-dest"
                name="destination"
                value={communeDest}
                onChange={setCommuneDest}
                communes={communeOptions}
                placeholder="Rechercher une commune…"
                className={inputClass}
              />
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
            <div className="space-y-2 rounded-lg bg-phoebe-green/5 px-4 py-3">
              <p className="text-sm text-phoebe-anthracite/60">
                Zone tarifaire :{" "}
                <span className="font-medium text-phoebe-green-deep">
                  {destZone.nom}
                </span>
                {coeff > 1 && (
                  <span className="ml-2 text-xs text-phoebe-gold">
                    (coefficient ×{coeff.toFixed(2)})
                  </span>
                )}
              </p>
              <p className="text-xs text-phoebe-anthracite/50">
                {destZone.km_inclus_par_jour} km inclus/jour · Supplément {destZone.supplement_km_fcfa} FCFA/km au-delà
              </p>
              {chauffeurStatut === "obligatoire" && (
                <p className="text-xs font-medium text-error">
                  Chauffeur obligatoire pour cette zone ({tarifChauffeur.toLocaleString("fr-FR")} FCFA/jour inclus)
                </p>
              )}
              {chauffeurStatut === "recommande" && (
                <p className="text-xs font-medium text-phoebe-gold">
                  Chauffeur recommandé pour cette zone ({tarifChauffeur.toLocaleString("fr-FR")} FCFA/jour)
                </p>
              )}
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
                <div key={l.groupKey}>
                  <div className="flex justify-between">
                    <dt className="text-phoebe-anthracite/60">
                      {l.marque} {l.modele}
                      {l.quantite > 1 ? ` ×${l.quantite}` : ""} — {l.prixZone.toLocaleString("fr-FR")} FCFA/j × {nbJours}j
                    </dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {l.montantLocation.toLocaleString("fr-FR")} FCFA
                    </dd>
                  </div>
                  {l.montantChauffeur > 0 && (
                    <div className="flex justify-between text-xs">
                      <dt className="text-phoebe-anthracite/40 pl-4">
                        + Chauffeur{l.avecChauffeurEffectif && chauffeurStatut === "obligatoire" ? " (obligatoire)" : ""}
                      </dt>
                      <dd className="text-phoebe-anthracite/60">
                        {l.montantChauffeur.toLocaleString("fr-FR")} FCFA
                      </dd>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-1">
                <dt className="text-phoebe-anthracite/60">Montant location</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {totalMontant.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-phoebe-anthracite/60">
                  Dépôt de garantie (caution remboursable)
                  {cautionMult > 1 && <span className="text-xs text-phoebe-gold"> ×{cautionMult.toFixed(1)}</span>}
                </dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {totalCaution.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
              <div className="flex justify-between border-t border-phoebe-anthracite/10 pt-2 mt-1">
                <dt className="font-semibold text-phoebe-anthracite">Total à payer aujourd&apos;hui</dt>
                <dd className="font-bold text-phoebe-green">
                  {grandTotal.toLocaleString("fr-FR")} FCFA
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-phoebe-anthracite/40">
              La caution est intégralement restituée au retour du véhicule, sauf retenue pour dégâts ou carburant manquant.
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

        <SubmitButton>Procéder au paiement — {grandTotal > 0 ? `${grandTotal.toLocaleString("fr-FR")} FCFA` : ""}</SubmitButton>
      </form>

      <div className="mt-3 space-y-3">
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 border-t border-phoebe-anthracite/10" />
            <span className="text-xs text-phoebe-anthracite/40">ou</span>
            <div className="flex-1 border-t border-phoebe-anthracite/10" />
          </div>

          {!showNego ? (
            <button
              type="button"
              onClick={() => setShowNego(true)}
              className="block w-full rounded-xl border-2 border-phoebe-gold/30 py-3 text-center text-sm font-semibold text-phoebe-gold transition-all hover:border-phoebe-gold hover:bg-phoebe-gold/5"
            >
              Négocier le prix
            </button>
          ) : (
            <div className="rounded-xl border border-phoebe-gold/30 bg-phoebe-gold/5 p-4 space-y-3">
              <p className="text-sm font-medium text-phoebe-anthracite">
                Négocier le prix via WhatsApp
              </p>
              <p className="text-xs text-phoebe-anthracite/60">
                Votre réservation sera créée et les véhicules bloqués.
                Un opérateur vous enverra le prix final après discussion.
              </p>
              <textarea
                value={negoNote}
                onChange={(e) => setNegoNote(e.target.value)}
                placeholder="Votre proposition ou commentaire (optionnel)"
                rows={2}
                className={inputClass}
              />
              {negoState.error && (
                <p className="text-xs text-error">{negoState.error}</p>
              )}
              <form action={negoAction}>
                <input type="hidden" name="debut" value={debut} />
                <input type="hidden" name="fin" value={fin} />
                <input type="hidden" name="ville_depart" value={communeDepart} />
                <input type="hidden" name="ville_depart_autre" value={autreDepartNom} />
                <input type="hidden" name="destination" value={communeDest} />
                <input type="hidden" name="destination_autre" value={autreDestNom} />
                <input type="hidden" name="negociation_note" value={negoNote} />
                <input type="hidden" name="lignes" value={lignesJson} />
                <SubmitButton className="w-full rounded-xl bg-phoebe-gold py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-gold/90 hover:shadow-md">
                  Envoyer la demande de négociation
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
    </>
  );
}
