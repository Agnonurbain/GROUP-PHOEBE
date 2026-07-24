import type { Metadata } from "next"
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getZonesTarifaires, getCommunes, getIntervallesPrix, getVehiculesPrixBase } from "@/lib/tarifs-cache";
import { ScrollReveal } from "@/components/effects";
import { TarifsTabs } from "./tarifs-tabs";
import { CoefficientsForm } from "./coefficients-form";
import { MapboxEditor } from "./mapbox-editor";
import { PrixAutoGrid } from "./prix-auto-grid";
import { CommunesList } from "./communes-list";
import { AjouterCommuneForm } from "./ajouter-commune-form";
import { IntervallesList } from "./intervalles-list";
import { AjouterIntervalleForm } from "./ajouter-intervalle-form";
import { CAT_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tarifs — Administration",
  description: "Configurez les tarifs par zone et catégorie de véhicule GROUP PHOEBE.",
}

export default async function TarifsPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.sub)
    .single();
  if (profile?.role !== "proprietaire") redirect("/admin");

  const [zones, communes, vehicules, intervalles] = await Promise.all([
      getZonesTarifaires(),
      getCommunes(),
      getVehiculesPrixBase(),
      getIntervallesPrix(),
    ]);

  const intervallesList = (intervalles ?? []).map((ip: typeof intervalles[0]) => ({
    id: ip.id,
    zone_id: ip.zone_id,
    categorie: CAT_LABELS[ip.categorie_vehicule as keyof typeof CAT_LABELS] ?? ip.categorie_vehicule,
    type: ip.type === "location" ? "Location" : "Vente",
    prix_min: Number(ip.prix_min),
    prix_max: Number(ip.prix_max),
  }));

  const zonesData = (zones ?? []).map((z: typeof zones[0]) => ({
    id: z.id,
    nom: z.nom,
    description: z.description,
    coefficient_majoration: Number((z as Record<string, unknown>).coefficient_majoration) || 1,
    caution_multiplicateur: Number((z as Record<string, unknown>).caution_multiplicateur) || 1,
    km_inclus_par_jour: Number((z as Record<string, unknown>).km_inclus_par_jour) || 150,
    supplement_km_fcfa: Number((z as Record<string, unknown>).supplement_km_fcfa) || 200,
    chauffeur_statut: ((z as Record<string, unknown>).chauffeur_statut as string) || "optionnel",
    tarif_chauffeur_journalier: Number((z as Record<string, unknown>).tarif_chauffeur_journalier) || 10000,
    geojson: (z as Record<string, unknown>).geojson as Record<string, unknown> | null,
  }));

  const categories = Object.keys(CAT_LABELS);
  const prixParCategorie = categories
    .map((cat) => {
      const vCat = (vehicules ?? []).filter((v: typeof vehicules[0]) => v.categorie === cat);
      if (vCat.length === 0) return null;
      const prices = vCat.map((v) => Number(v.prix_journalier));
      return {
        categorie: cat,
        catLabel: CAT_LABELS[cat] ?? cat,
        min: Math.min(...prices),
        max: Math.max(...prices),
        count: vCat.length,
      };
    })
    .filter(Boolean) as { categorie: string; catLabel: string; min: number; max: number; count: number }[];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <ScrollReveal variant="fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Zones &amp; Tarifs
        </h1>
        <p className="mt-1 text-sm text-phoebe-anthracite/50">
          Pilotez vos marges en ajustant les coefficients par zone. Les prix finaux sont
          calcules automatiquement depuis le prix de base de chaque vehicule.
        </p>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
        <TarifsTabs>
          {{
            coefficients: (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-xl border border-phoebe-pearl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-phoebe-pearl bg-phoebe-pearl/30">
                        <th className="px-4 py-3 text-left font-semibold text-phoebe-anthracite">Zone</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">Coeff. prix</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">Caution x</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">KM/jour</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">Supp. km</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">Chauffeur</th>
                        <th className="px-4 py-3 text-right font-medium text-phoebe-anthracite/60">Tarif chauf.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zonesData.map((z) => (
                        <tr key={z.id} className="border-b border-phoebe-pearl/50 last:border-0">
                          <td className="px-4 py-3">
                            <span className="font-medium text-phoebe-anthracite">{z.nom}</span>
                            {z.description && (
                              <span className="ml-2 text-xs text-phoebe-anthracite/40">{z.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-phoebe-green tabular-nums">
                            x{z.coefficient_majoration.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-phoebe-anthracite/60">
                            x{z.caution_multiplicateur.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-phoebe-anthracite/60">
                            {z.km_inclus_par_jour}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-phoebe-anthracite/60">
                            {z.supplement_km_fcfa.toLocaleString("fr-FR")} F
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              z.chauffeur_statut === "obligatoire"
                                ? "bg-error/10 text-error"
                                : z.chauffeur_statut === "recommande"
                                  ? "bg-phoebe-gold/10 text-phoebe-gold"
                                  : "bg-phoebe-pearl text-phoebe-anthracite/50"
                            }`}>
                              {z.chauffeur_statut}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-phoebe-anthracite/60">
                            {z.tarif_chauffeur_journalier.toLocaleString("fr-FR")} F/j
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {zonesData.map((z) => (
                  <section
                    key={z.id}
                    className="rounded-xl border border-phoebe-pearl bg-white p-5 shadow-sm"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-phoebe-anthracite">
                      {z.nom}
                    </h3>
                    <CoefficientsForm
                      zoneId={z.id}
                      initial={{
                        coefficient_majoration: z.coefficient_majoration,
                        caution_multiplicateur: z.caution_multiplicateur,
                        km_inclus_par_jour: z.km_inclus_par_jour,
                        supplement_km_fcfa: z.supplement_km_fcfa,
                        chauffeur_statut: z.chauffeur_statut,
                        tarif_chauffeur_journalier: z.tarif_chauffeur_journalier,
                      }}
                    />
                  </section>
                ))}

                <div className="rounded-xl border border-phoebe-pearl/60 bg-phoebe-pearl/20 px-4 py-3">
                  <p className="text-xs text-phoebe-anthracite/40">
                    Seul le proprietaire peut modifier ces parametres. Chaque modification est enregistree dans le journal d&apos;audit.
                  </p>
                </div>
              </div>
            ),

            cartographie: (
              <div className="space-y-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                  <p className="text-xs font-medium text-blue-800">
                    Hierarchie des sources de zone
                  </p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    La liste des communes est la source de verite pour determiner la zone tarifaire d&apos;une destination.
                    Les polygones GeoJSON servent de reference visuelle et pourront etre utilises pour la detection GPS automatique.
                  </p>
                </div>

                {zonesData.map((z) => (
                  <section
                    key={z.id}
                    className="rounded-xl border border-phoebe-pearl bg-white p-5 shadow-sm"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-phoebe-anthracite">
                      {z.nom}
                      {z.geojson && (
                        <span className="ml-2 rounded-full bg-phoebe-green/10 px-2 py-0.5 text-[10px] font-medium text-phoebe-green-deep">
                          polygone defini
                        </span>
                      )}
                    </h3>
                    <MapboxEditor
                      zoneId={z.id}
                      zoneName={z.nom}
                      initialGeojson={z.geojson}
                    />
                  </section>
                ))}
              </div>
            ),

            prix: (
              <div className="space-y-8">
                <PrixAutoGrid
                  zones={zonesData.map((z) => ({
                    id: z.id,
                    nom: z.nom,
                    coefficient_majoration: z.coefficient_majoration,
                  }))}
                  prixParCategorie={prixParCategorie}
                />

                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                    Intervalles de prix par zone
                  </h3>
                  <div className="space-y-4">
                    {zonesData.map((z) => {
                      const zoneIntervalles = intervallesList.filter(
                        (ip) => ip.zone_id === z.id
                      );
                      return (
                        <section
                          key={z.id}
                          className="rounded-xl border border-phoebe-pearl bg-white p-5 shadow-sm"
                        >
                          <h4 className="mb-2 text-sm font-semibold text-phoebe-anthracite">
                            {z.nom}
                          </h4>
                          <IntervallesList intervalles={zoneIntervalles} />
                          <div className="mt-3 border-t border-phoebe-pearl pt-3">
                            <AjouterIntervalleForm zoneId={z.id} />
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                    Communes par zone
                  </h3>
                  <div className="space-y-4">
                    {zonesData.map((z) => {
                      const zoneCommunes = (communes ?? []).filter(
                        (c) => c.zone_id === z.id
                      );
                      return (
                        <section
                          key={z.id}
                          className="rounded-xl border border-phoebe-pearl bg-white p-5 shadow-sm"
                        >
                          <h4 className="mb-2 text-sm font-semibold text-phoebe-anthracite">
                            {z.nom}
                            <span className="ml-2 text-xs font-normal text-phoebe-anthracite/40">
                              ({zoneCommunes.length} commune{zoneCommunes.length > 1 ? "s" : ""})
                            </span>
                          </h4>
                          <CommunesList communes={zoneCommunes} />
                          <div className="mt-3 border-t border-phoebe-pearl pt-3">
                            <AjouterCommuneForm zoneId={z.id} />
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
            ),
          }}
        </TarifsTabs>
      </ScrollReveal>
    </div>
  );
}
