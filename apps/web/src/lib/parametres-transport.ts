import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import {
  DELAI_NEGOCIATION_HEURES_DEFAUT,
  DELAI_SANS_REPONSE_HEURES,
  DELAI_NON_PRESENTATION_HEURES,
} from "@/lib/constants";
import { HORAIRES_DEFAUT, type HorairesOuvres } from "@/lib/heures-ouvrees";

export type ParametresTransport = {
  delai_negociation_heures: number;
  delai_sans_reponse_heures: number;
  delai_non_presentation_heures: number;
  /** Chaque délai décompte-t-il en heures ouvrées ou en temps calendaire ? */
  delai_negociation_ouvre: boolean;
  delai_sans_reponse_ouvre: boolean;
  delai_non_presentation_ouvre: boolean;
  horaires: HorairesOuvres;
};

/**
 * Repli sur les constantes historiques si la ligne est injoignable.
 *
 * Ces délais pilotent des crons qui libèrent des véhicules et retiennent des
 * cautions : sans repli, une lecture ratée les rendrait tous nuls, et
 * l'expiration s'appliquerait à tout — y compris à une réservation d'hier.
 */
export const PARAMETRES_TRANSPORT_DEFAUT: ParametresTransport = {
  delai_negociation_heures: DELAI_NEGOCIATION_HEURES_DEFAUT,
  delai_sans_reponse_heures: DELAI_SANS_REPONSE_HEURES,
  delai_non_presentation_heures: DELAI_NON_PRESENTATION_HEURES,
  delai_negociation_ouvre: true,
  delai_sans_reponse_ouvre: false,
  delai_non_presentation_ouvre: true,
  horaires: HORAIRES_DEFAUT,
};

export const getParametresTransport = unstable_cache(
  async (): Promise<ParametresTransport> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("parametres_transport")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (!data) return PARAMETRES_TRANSPORT_DEFAUT;

    return {
      delai_negociation_heures: Number(data.delai_negociation_heures),
      delai_sans_reponse_heures: Number(data.delai_sans_reponse_heures),
      delai_non_presentation_heures: Number(data.delai_non_presentation_heures),
      delai_negociation_ouvre: data.delai_negociation_ouvre,
      delai_sans_reponse_ouvre: data.delai_sans_reponse_ouvre,
      delai_non_presentation_ouvre: data.delai_non_presentation_ouvre,
      horaires: {
        jours: data.jours_ouvres ?? HORAIRES_DEFAUT.jours,
        ouverture: data.heure_ouverture ?? HORAIRES_DEFAUT.ouverture,
        fermeture: data.heure_fermeture ?? HORAIRES_DEFAUT.fermeture,
      },
    };
  },
  ["parametres-transport"],
  { tags: ["parametres-transport"], revalidate: 3600 }
);

/** Millisecondes, pour composer une échéance. */
export function heuresEnMs(heures: number): number {
  return heures * 60 * 60 * 1000;
}

/**
 * « 4 h », « 30 min », « 1 h 30 » — le délai est annoncé au client dans le
 * formulaire de demande de prix, il doit se lire sans calcul.
 */
export function formaterDelai(heures: number): string {
  const total = Math.round(heures * 60);
  const h = Math.floor(total / 60);
  const min = total % 60;
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h} h`;
  return `${h} h ${min}`;
}
