import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { CommunesList } from "./communes-list";
import { IntervallesList } from "./intervalles-list";
import { AjouterCommuneForm } from "./ajouter-commune-form";
import { AjouterIntervalleForm } from "./ajouter-intervalle-form";
import { GeojsonEditor } from "./geojson-editor";
import { CoefficientsForm } from "./coefficients-form";
import { CAT_LABELS } from "@/lib/constants";


const TYPE_LABELS: Record<string, string> = {
  location: "Location",
  vente: "Vente",
};

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

  const [{ data: zones }, { data: communes }, { data: intervalles }] =
    await Promise.all([
      supabase
        .from("zones_tarifaires")
        .select("*")
        .order("ordre", { ascending: true }),
      supabase
        .from("communes")
        .select("*")
        .order("nom", { ascending: true }),
      supabase
        .from("intervalles_prix")
        .select("*, zones_tarifaires!inner(nom)")
        .order("zone_id"),
    ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <ScrollReveal variant="fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Zones &amp; Tarifs
        </h1>
      </ScrollReveal>

      {(zones ?? []).map((zone, zoneIndex) => {
        const zoneCommunes = (communes ?? []).filter(
          (c) => c.zone_id === zone.id
        );
        const zoneIntervalles = (intervalles ?? []).filter(
          (ip) => ip.zone_id === zone.id
        );

        return (
          <ScrollReveal key={zone.id} variant="fade-up" delay={0.1 * (zoneIndex + 1)}>
          <section
            className="group relative overflow-hidden rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm space-y-6 transition-all hover:shadow-md"
          >
            <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-phoebe-gold-light via-phoebe-gold to-phoebe-gold-dark transition-transform duration-300 group-hover:scale-x-100" />
            <div>
              <h2 className="text-lg font-semibold text-phoebe-anthracite">
                {zone.nom}
              </h2>
              {zone.description && (
                <p className="text-sm text-phoebe-anthracite/50">
                  {zone.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4">
                <CoefficientsForm
                  zoneId={zone.id}
                  initial={{
                    coefficient_majoration: Number((zone as Record<string, unknown>).coefficient_majoration) || 1,
                    caution_multiplicateur: Number((zone as Record<string, unknown>).caution_multiplicateur) || 1,
                    km_inclus_par_jour: Number((zone as Record<string, unknown>).km_inclus_par_jour) || 150,
                    supplement_km_fcfa: Number((zone as Record<string, unknown>).supplement_km_fcfa) || 200,
                    chauffeur_statut: ((zone as Record<string, unknown>).chauffeur_statut as string) || "optionnel",
                    tarif_chauffeur_journalier: Number((zone as Record<string, unknown>).tarif_chauffeur_journalier) || 10000,
                  }}
                />
                <GeojsonEditor
                  zoneId={zone.id}
                  zoneName={zone.nom}
                  initialGeojson={(zone as Record<string, unknown>).geojson as Record<string, unknown> | null}
                />
              </div>
            </div>

            {/* Communes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Communes ({zoneCommunes.length})
              </h3>
              <CommunesList communes={zoneCommunes} />
              <div className="mt-3 border-t border-phoebe-pearl pt-3">
                <AjouterCommuneForm zoneId={zone.id} />
              </div>
            </div>

            {/* Intervalles de prix */}
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Intervalles de prix
              </h3>
              <IntervallesList
                intervalles={zoneIntervalles.map((ip) => ({
                  id: ip.id,
                  categorie: CAT_LABELS[ip.categorie_vehicule] ?? ip.categorie_vehicule,
                  type: TYPE_LABELS[ip.type] ?? ip.type,
                  prix_min: Number(ip.prix_min),
                  prix_max: Number(ip.prix_max),
                }))}
              />
              <div className="mt-3 border-t border-phoebe-pearl pt-3">
                <AjouterIntervalleForm zoneId={zone.id} />
              </div>
            </div>
          </section>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
