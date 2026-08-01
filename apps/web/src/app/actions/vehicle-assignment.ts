"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@group-phoebe/database/types";
import { parsePeriodeRange } from "@/lib/periode";
import { contratMobilise, type CreneauContrat } from "@/lib/contrats";

const CAUTION_BASE_DEFAUT = 50000;

type AdminClient = ReturnType<typeof createAdminClient<Database>>;

export type ZoneTarif = {
  coefficient_majoration: number;
  caution_multiplicateur: number;
  tarif_chauffeur_journalier: number;
  chauffeur_statut: string;
};

export type AssignedVehicle = {
  vehiculeId: string;
  chauffeurId: string | null;
  montant: number;
  caution: number;
  marque: string;
  modele: string;
};

export type AssignmentResult =
  | { ok: true; vehicles: AssignedVehicle[] }
  | { ok: false; error: string };

export async function assignerVehiculesGroupe(
  admin: AdminClient,
  marque: string,
  modele: string,
  quantite: number,
  periode: string,
  avecChauffeur: boolean,
  nbJours: number,
  zone?: ZoneTarif
): Promise<AssignmentResult> {
  const { data: candidats } = await admin
    .from("vehicules")
    .select("*")
    .eq("marque", marque)
    .eq("modele", modele)
    .eq("statut", "disponible");

  if (!candidats || candidats.length === 0) {
    return { ok: false, error: `${marque} ${modele} n'est plus disponible.` };
  }

  if (candidats.length < quantite) {
    return {
      ok: false,
      error: `Seulement ${candidats.length} ${marque} ${modele} disponible(s), vous en demandez ${quantite}.`,
    };
  }

  // Distingue « plus de véhicule » de « plus de chauffeur » : les deux menaient
  // au même message, qui parlait du véhicule alors qu'il était libre. Un client
  // renonçait, ou réessayait à l'identique.
  let bloqueParChauffeur = false;

  const reserved: {
    vehiculeId: string;
    chauffeurId: string | null;
    montant: number;
    caution: number;
  }[] = [];

  // Abonnements en cours sur ces véhicules. Un contrat n'occupe pas
  // `disponibilites_vehicule` — un ramassage scolaire de neuf mois y bloquerait
  // le véhicule en bloc alors qu'il ne sert que matin et soir. On confronte donc
  // la demande au créneau, ici, avant de poser quoi que ce soit.
  const bornes = parsePeriodeRange(periode);
  const { data: contrats } = await admin
    .from("contrats_recurrents")
    .select("vehicule_id, jours_semaine, heure_debut, heure_fin, date_debut, date_fin, statut")
    .eq("statut", "actif")
    .in("vehicule_id", candidats.map((c) => c.id));

  const contratsParVehicule = new Map<string, CreneauContrat[]>();
  for (const c of contrats ?? []) {
    if (!c.vehicule_id) continue;
    const liste = contratsParVehicule.get(c.vehicule_id) ?? [];
    liste.push(c as CreneauContrat);
    contratsParVehicule.set(c.vehicule_id, liste);
  }

  function prisParAbonnement(vehiculeId: string): boolean {
    if (!bornes) return false;
    const liste = contratsParVehicule.get(vehiculeId);
    if (!liste?.length) return false;
    const debut = new Date(bornes.debut);
    const fin = new Date(bornes.fin);
    return liste.some((c) => contratMobilise(c, debut, fin));
  }

  const reservedVehicules: { vehiculeId: string; periode: string }[] = [];
  const reservedChauffeurs: { chauffeurId: string; periode: string }[] = [];

  async function rollback() {
    for (const rv of reservedVehicules) {
      await admin
        .from("disponibilites_vehicule")
        .delete()
        .eq("vehicule_id", rv.vehiculeId)
        .eq("type", "reservation")
        .eq("periode", rv.periode);
    }
    for (const rc of reservedChauffeurs) {
      await admin
        .from("disponibilites_chauffeur")
        .delete()
        .eq("chauffeur_id", rc.chauffeurId)
        .eq("periode", rc.periode);
    }
  }

  for (const v of candidats) {
    if (reserved.length >= quantite) break;

    if (!v.prix_journalier) continue;

    // Écarté avant toute écriture : inutile de poser une réservation pour la
    // retirer juste après.
    if (prisParAbonnement(v.id)) continue;

    const { error: dispoErr } = await admin
      .from("disponibilites_vehicule")
      .insert({ vehicule_id: v.id, periode, type: "reservation" });

    if (dispoErr) {
      if (dispoErr.code === "23P01") continue;
      await rollback();
      return { ok: false, error: dispoErr.message };
    }

    reservedVehicules.push({ vehiculeId: v.id, periode });

    let chauffeurId: string | null = null;

    if (avecChauffeur) {
      if (!v.chauffeur_disponible) {
        bloqueParChauffeur = true;
        await admin
          .from("disponibilites_vehicule")
          .delete()
          .eq("vehicule_id", v.id)
          .eq("type", "reservation")
          .eq("periode", periode);
        reservedVehicules.pop();
        continue;
      }

      // `!inner` + filtre sur `actif` : sans lui, un chauffeur désactivé restait
      // candidat à toute nouvelle course. La désactivation ne servait à rien
      // d'autre qu'à l'affichage.
      const { data: vcLinks } = await admin
        .from("vehicule_chauffeurs")
        .select("chauffeur_id, chauffeurs!inner(actif)")
        .eq("vehicule_id", v.id)
        .eq("chauffeurs.actif", true);

      const candidatsChauffeur = vcLinks?.map((l) => l.chauffeur_id) ?? [];

      for (const cid of candidatsChauffeur) {
        const { error: chauffeurErr } = await admin
          .from("disponibilites_chauffeur")
          .insert({ chauffeur_id: cid, periode });

        if (!chauffeurErr) {
          chauffeurId = cid;
          break;
        }
        if (chauffeurErr.code !== "23P01") {
          console.error("Erreur dispo chauffeur:", chauffeurErr.message);
        }
      }

      if (!chauffeurId) {
        bloqueParChauffeur = true;
        await admin
          .from("disponibilites_vehicule")
          .delete()
          .eq("vehicule_id", v.id)
          .eq("type", "reservation")
          .eq("periode", periode);
        reservedVehicules.pop();
        continue;
      }

      reservedChauffeurs.push({ chauffeurId, periode });
    }

    const coeff = zone?.coefficient_majoration ?? 1;
    const prixZone = Math.round(Number(v.prix_journalier) * coeff);
    const montantLocation = prixZone * nbJours;
    const chauffeurObligatoire = zone?.chauffeur_statut === "obligatoire";
    const montantChauffeur = (avecChauffeur || chauffeurObligatoire)
      ? (zone?.tarif_chauffeur_journalier ?? 0) * nbJours
      : 0;
    const montant = montantLocation + montantChauffeur;
    const cautionBase = Number((v as Record<string, unknown>).caution_base_fcfa) || CAUTION_BASE_DEFAUT;
    const cautionMult = zone?.caution_multiplicateur ?? 1;
    const caution = Math.round(cautionBase * cautionMult);

    reserved.push({ vehiculeId: v.id, chauffeurId, montant, caution });
  }

  if (reserved.length < quantite) {
    await rollback();
    if (bloqueParChauffeur) {
      return {
        ok: false,
        error:
          `Aucun chauffeur disponible pour ${marque} ${modele} sur cette période. ` +
          `Le véhicule reste réservable sans chauffeur.`,
      };
    }
    return {
      ok: false,
      error: `Seulement ${reserved.length} ${marque} ${modele} disponible(s) sur cette période, vous en demandez ${quantite}.`,
    };
  }

  return {
    ok: true,
    vehicles: reserved.map((r) => ({ ...r, marque, modele })),
  };
}

