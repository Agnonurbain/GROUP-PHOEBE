"use client";

import { useActionState, useState } from "react";
import {
  avancerStatutLivraison,
  confirmerLivraison,
  signalerEchecLivraison,
  type LivreurState,
} from "@/app/actions/livreur";
import { STATUT_LIVRAISON, TRANSITIONS_LIVRAISON, type StatutLivraison } from "@/lib/livraison";

type Colis = {
  id: string;
  numeroSuivi: string;
  statut: string;
  statutLabel: string;
  zoneLabel: string;
  modeLabel: string;
  adresseCollecte: string;
  adresseLivraison: string;
  expediteurNom: string;
  expediteurContact: string;
  destinataireNom: string;
  destinataireContact: string;
  natureColis: string | null;
  poidsKg: number | null;
  echecMotif: string | null;
};

const LIBELLE_ACTION: Record<string, string> = {
  prise_en_charge: "Colis récupéré",
  en_transit: "Je pars livrer",
};

// Cibles de bouton simple : la livraison et l'échec ont leur propre formulaire,
// parce qu'ils exigent une pièce.
function transitionsSimples(statut: string): StatutLivraison[] {
  const suivants = TRANSITIONS_LIVRAISON[statut as StatutLivraison] ?? [];
  return suivants.filter(
    (s) => s !== STATUT_LIVRAISON.livree && s !== STATUT_LIVRAISON.echecLivraison
  );
}

export function ColisCard({ colis }: { colis: Colis }) {
  const [ouvert, setOuvert] = useState<"livraison" | "echec" | null>(null);

  const [etatAvance, avance, avanceEnCours] = useActionState<LivreurState, FormData>(
    avancerStatutLivraison,
    {}
  );
  const [etatLivraison, livrer, livraisonEnCours] = useActionState<LivreurState, FormData>(
    confirmerLivraison,
    {}
  );
  const [etatEchec, echouer, echecEnCours] = useActionState<LivreurState, FormData>(
    signalerEchecLivraison,
    {}
  );

  const simples = transitionsSimples(colis.statut);
  const peutLivrer = (TRANSITIONS_LIVRAISON[colis.statut as StatutLivraison] ?? []).includes(
    STATUT_LIVRAISON.livree
  );
  const peutEchouer = (TRANSITIONS_LIVRAISON[colis.statut as StatutLivraison] ?? []).includes(
    STATUT_LIVRAISON.echecLivraison
  );

  const erreur = etatAvance.error ?? etatLivraison.error ?? etatEchec.error;

  return (
    <article className="rounded-2xl border border-public-border bg-public-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-sm font-bold">{colis.numeroSuivi}</span>
        <span className="shrink-0 rounded-full bg-accent-orange/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent-orange">
          {colis.statutLabel}
        </span>
      </div>

      <p className="mt-1 text-xs text-public-text-muted">
        {colis.zoneLabel} · {colis.modeLabel}
        {colis.poidsKg ? ` · ${colis.poidsKg} kg` : ""}
        {colis.natureColis ? ` · ${colis.natureColis}` : ""}
      </p>

      {colis.echecMotif && (
        <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          Échec précédent : {colis.echecMotif}
        </p>
      )}

      <dl className="mt-3 space-y-2 border-t border-public-border pt-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-public-text-muted">Retrait</dt>
          <dd className="text-public-text">{colis.adresseCollecte}</dd>
          <dd className="text-xs text-public-text-muted">
            {colis.expediteurNom} ·{" "}
            <a href={`tel:${colis.expediteurContact}`} className="text-accent-orange underline">
              {colis.expediteurContact}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-public-text-muted">Livraison</dt>
          <dd className="text-public-text">{colis.adresseLivraison}</dd>
          <dd className="text-xs text-public-text-muted">
            {colis.destinataireNom} ·{" "}
            <a href={`tel:${colis.destinataireContact}`} className="text-accent-orange underline">
              {colis.destinataireContact}
            </a>
          </dd>
        </div>
      </dl>

      {erreur && (
        <p role="alert" className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {erreur}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {simples.map((cible) => (
          <form key={cible} action={avance}>
            <input type="hidden" name="expedition_id" value={colis.id} />
            <input type="hidden" name="statut" value={cible} />
            <button
              type="submit"
              disabled={avanceEnCours}
              className="w-full rounded-xl bg-accent-orange px-4 py-3 text-sm font-semibold text-[#0A0A0A] transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {avanceEnCours ? "…" : LIBELLE_ACTION[cible] ?? cible}
            </button>
          </form>
        ))}

        {peutLivrer && ouvert !== "livraison" && (
          <button
            type="button"
            onClick={() => setOuvert("livraison")}
            className="w-full rounded-xl bg-accent-green px-4 py-3 text-sm font-semibold text-white transition-all active:scale-[0.99]"
          >
            Colis remis
          </button>
        )}

        {peutLivrer && ouvert === "livraison" && (
          <FormulaireLivraison
            colisId={colis.id}
            action={livrer}
            enCours={livraisonEnCours}
            onAnnuler={() => setOuvert(null)}
          />
        )}

        {peutEchouer && ouvert !== "echec" && (
          <button
            type="button"
            onClick={() => setOuvert("echec")}
            className="w-full rounded-xl border border-public-border px-4 py-2.5 text-sm font-medium text-public-text-muted transition-colors hover:text-error"
          >
            Signaler un échec
          </button>
        )}

        {peutEchouer && ouvert === "echec" && (
          <form action={echouer} className="space-y-2 rounded-xl border border-public-border p-3">
            <input type="hidden" name="expedition_id" value={colis.id} />
            <label htmlFor={`motif-${colis.id}`} className="block text-xs font-medium">
              Que s&apos;est-il passé ?
            </label>
            <textarea
              id={`motif-${colis.id}`}
              name="echec_motif"
              required
              rows={2}
              placeholder="Destinataire absent, adresse introuvable…"
              className="w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={echecEnCours}
                className="flex-1 rounded-lg bg-error px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {echecEnCours ? "…" : "Valider l'échec"}
              </button>
              <button
                type="button"
                onClick={() => setOuvert(null)}
                className="rounded-lg border border-public-border px-3 py-2.5 text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

/**
 * La position est capturée au moment de la remise, si le navigateur la donne.
 * Elle reste facultative : un GPS refusé, coupé ou trop lent ne doit pas
 * empêcher de clôturer une course déjà faite.
 */
function FormulaireLivraison({
  colisId,
  action,
  enCours,
  onAnnuler,
}: {
  colisId: string;
  action: (formData: FormData) => void;
  enCours: boolean;
  onAnnuler: () => void;
}) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoEtat, setGeoEtat] = useState<"idle" | "encours" | "refuse">("idle");

  function capturerPosition() {
    if (!navigator.geolocation) {
      setGeoEtat("refuse");
      return;
    }
    setGeoEtat("encours");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoEtat("idle");
      },
      () => setGeoEtat("refuse"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-public-border p-3">
      <input type="hidden" name="expedition_id" value={colisId} />
      {position && (
        <>
          <input type="hidden" name="latitude" value={position.lat} />
          <input type="hidden" name="longitude" value={position.lng} />
        </>
      )}

      <div>
        <label htmlFor={`recu-${colisId}`} className="block text-xs font-medium">
          Reçu par
        </label>
        <input
          id={`recu-${colisId}`}
          name="recu_par"
          required
          placeholder="Nom de la personne"
          className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-public-text-muted">
          Pas toujours le destinataire déclaré — notez qui a réellement pris le colis.
        </p>
      </div>

      <div>
        <label htmlFor={`photo-${colisId}`} className="block text-xs font-medium">
          Photo de la remise
        </label>
        <input
          id={`photo-${colisId}`}
          name="preuve_photo"
          type="file"
          accept="image/*"
          capture="environment"
          required
          className="mt-1 w-full rounded-lg border border-public-border bg-public-bg px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={capturerPosition}
        className="w-full rounded-lg border border-public-border px-3 py-2 text-xs text-public-text-muted"
      >
        {position
          ? "Position enregistrée ✓"
          : geoEtat === "encours"
            ? "Localisation…"
            : geoEtat === "refuse"
              ? "Position indisponible — vous pouvez continuer"
              : "Ajouter ma position (facultatif)"}
      </button>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enCours}
          className="flex-1 rounded-lg bg-accent-green px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enCours ? "Envoi…" : "Confirmer la livraison"}
        </button>
        <button
          type="button"
          onClick={onAnnuler}
          className="rounded-lg border border-public-border px-3 py-2.5 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
