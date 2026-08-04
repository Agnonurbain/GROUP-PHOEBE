import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { getParametresTransport } from "@/lib/parametres-transport";
import {
  PARAMETRES_RENDEZ_VOUS_DEFAUT,
  type ParametresRendezVous,
} from "@/lib/rendez-vous";
import type { HorairesOuvres } from "@/lib/heures-ouvrees";

/**
 * Tout ce qu'il faut pour dessiner un agenda.
 *
 * Les jours et heures d'ouverture NE SONT PAS relus ici : ils viennent de
 * `parametres_transport`, où ils vivent depuis 00075. Ce sont les mêmes murs et
 * les mêmes horaires que pour le décompte des délais transport — en tenir un
 * second jeu produirait deux calendriers qui finiraient par diverger.
 */
export type AgendaParametres = {
  params: ParametresRendezVous;
  horaires: HorairesOuvres;
  /** Dates fermées, « AAAA-MM-JJ ». */
  fermetures: string[];
};

export const getParametresRendezVous = unstable_cache(
  async (): Promise<{ params: ParametresRendezVous; fermetures: string[] }> => {
    const supabase = createPublicClient();

    const [{ data: p }, { data: f }] = await Promise.all([
      supabase
        .from("parametres_rendez_vous")
        .select("duree_minutes, capacite_par_creneau, delai_min_heures, horizon_jours")
        .eq("id", true)
        .maybeSingle(),
      // Seules les fermetures à venir comptent : les passées alourdiraient la
      // liste sans jamais rien écarter.
      supabase
        .from("fermetures_agence")
        .select("jour")
        .gte("jour", new Date().toISOString().slice(0, 10))
        .order("jour"),
    ]);

    // Repli sur les valeurs par défaut : une lecture ratée doit produire un
    // agenda plausible, pas un agenda vide qui ferait croire à une fermeture.
    const params: ParametresRendezVous = p
      ? {
          duree_minutes: Number(p.duree_minutes) || PARAMETRES_RENDEZ_VOUS_DEFAUT.duree_minutes,
          capacite_par_creneau:
            Number(p.capacite_par_creneau) || PARAMETRES_RENDEZ_VOUS_DEFAUT.capacite_par_creneau,
          // `??` et non `||` : zéro est une valeur légitime pour un délai de
          // prévenance — « réservable jusqu'à la dernière minute ».
          delai_min_heures:
            Number.isFinite(Number(p.delai_min_heures))
              ? Number(p.delai_min_heures)
              : PARAMETRES_RENDEZ_VOUS_DEFAUT.delai_min_heures,
          horizon_jours: Number(p.horizon_jours) || PARAMETRES_RENDEZ_VOUS_DEFAUT.horizon_jours,
        }
      : PARAMETRES_RENDEZ_VOUS_DEFAUT;

    return {
      params,
      fermetures: (f ?? []).map((x) => String(x.jour)),
    };
  },
  ["parametres-rendez-vous"],
  { tags: ["parametres-rendez-vous"], revalidate: 300 }
);

/** L'agenda complet : réglages, horaires partagés et fermetures. */
export async function getAgenda(): Promise<AgendaParametres> {
  const [{ params, fermetures }, transport] = await Promise.all([
    getParametresRendezVous(),
    getParametresTransport(),
  ]);
  return { params, fermetures, horaires: transport.horaires };
}
