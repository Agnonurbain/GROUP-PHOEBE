import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommunesList } from "./communes-list";
import { IntervallesList } from "./intervalles-list";
import { AjouterCommuneForm } from "./ajouter-commune-form";
import { AjouterIntervalleForm } from "./ajouter-intervalle-form";

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

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
      <h1 className="text-2xl font-bold text-phoebe-anthracite">
        Zones &amp; Tarifs
      </h1>

      {(zones ?? []).map((zone) => {
        const zoneCommunes = (communes ?? []).filter(
          (c) => c.zone_id === zone.id
        );
        const zoneIntervalles = (intervalles ?? []).filter(
          (ip) => ip.zone_id === zone.id
        );

        return (
          <section
            key={zone.id}
            className="rounded-xl border border-phoebe-pearl bg-white p-6 space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-phoebe-anthracite">
                {zone.nom}
              </h2>
              {zone.description && (
                <p className="text-sm text-phoebe-anthracite/50">
                  {zone.description}
                </p>
              )}
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
        );
      })}
    </div>
  );
}
