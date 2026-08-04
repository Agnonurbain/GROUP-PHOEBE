import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { HORAIRES_DEFAUT, type HorairesOuvres } from "@/lib/heures-ouvrees";

/**
 * Les jours et heures d'ouverture de GROUP PHOEBE.
 *
 * Un seul jeu pour toute la maison : le décompte des délais transport en heures
 * ouvrées (00075) et les créneaux de rendez-vous (00081) lisent d'ici. Ils
 * vivaient sur `parametres_transport`, ce qui était vrai tant que le transport
 * était seul à s'en servir — et faux depuis. Déplacés en 00083, avant qu'un
 * troisième usage ne les cherche en vain et n'en crée d'autres.
 */
export const getHorairesOuverture = unstable_cache(
  async (): Promise<HorairesOuvres> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("parametres_ouverture")
      .select("jours_ouvres, heure_ouverture, heure_fermeture")
      .eq("id", true)
      .maybeSingle();

    // Repli sur les horaires par défaut si la ligne est injoignable. Sans lui,
    // des horaires vides rendraient tout délai en heures ouvrées insoluble : le
    // budget ne s'épuiserait jamais et rien n'expirerait.
    if (!data) return HORAIRES_DEFAUT;

    const jours = Array.isArray(data.jours_ouvres)
      ? data.jours_ouvres.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
      : [];

    return {
      jours: jours.length > 0 ? jours : HORAIRES_DEFAUT.jours,
      ouverture: String(data.heure_ouverture ?? HORAIRES_DEFAUT.ouverture).slice(0, 5),
      fermeture: String(data.heure_fermeture ?? HORAIRES_DEFAUT.fermeture).slice(0, 5),
    };
  },
  ["parametres-ouverture"],
  { tags: ["parametres-ouverture"], revalidate: 300 }
);
