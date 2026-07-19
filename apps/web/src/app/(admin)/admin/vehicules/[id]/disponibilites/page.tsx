import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/effects";
import { BlocageVehiculeForm, BlocageChauffeurForm } from "./blocage-form";
import { BlocagesVehiculeList, BlocagesChauffeurList } from "./blocages-list";

export default async function DisponibilitesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicule } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!vehicule) redirect("/admin/vehicules");

  const { data: blocagesVehicule } = await supabase
    .from("disponibilites_vehicule")
    .select("*")
    .eq("vehicule_id", id)
    .order("periode", { ascending: true });

  const { data: vcLinks } = await supabase
    .from("vehicule_chauffeurs")
    .select("chauffeur_id, chauffeurs(id, nom, telephone)")
    .eq("vehicule_id", id);

  type ChauffeurAvecBlocages = {
    id: string;
    nom: string;
    telephone: string;
    blocages: { id: string; periode: string | null }[];
  };

  const chauffeursAvecBlocages: ChauffeurAvecBlocages[] = [];

  for (const link of vcLinks ?? []) {
    const c = link.chauffeurs as unknown as {
      id: string;
      nom: string;
      telephone: string;
    } | null;
    if (!c) continue;

    const { data: blocages } = await supabase
      .from("disponibilites_chauffeur")
      .select("id, periode")
      .eq("chauffeur_id", c.id)
      .order("periode", { ascending: true });

    chauffeursAvecBlocages.push({
      ...c,
      blocages: (blocages ?? []) as { id: string; periode: string | null }[],
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <ScrollReveal variant="fade-up">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
            Disponibilités — {vehicule.marque} {vehicule.modele}
          </h1>
          <Link
            href={`/admin/vehicules/${id}`}
            className="text-sm text-phoebe-anthracite/50 transition-colors hover:text-phoebe-green"
          >
            ← Retour au véhicule
          </Link>
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={0.1}>
      <section className="space-y-4 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-phoebe-anthracite">
          Périodes bloquées — Véhicule
        </h2>

        <BlocagesVehiculeList
          blocages={(blocagesVehicule ?? []) as { id: string; periode: string | null; type: string; vehicule_id: string }[]}
          vehiculeId={id}
        />

        <div className="border-t border-phoebe-pearl pt-4">
          <h3 className="mb-3 text-sm font-medium text-phoebe-anthracite/60">
            Ajouter un blocage
          </h3>
          <BlocageVehiculeForm vehiculeId={id} />
        </div>
      </section>
      </ScrollReveal>

      {vehicule.chauffeur_disponible && (
        <ScrollReveal variant="fade-up" delay={0.2}>
        <section className="space-y-6 rounded-2xl border border-phoebe-pearl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-phoebe-anthracite">
            Périodes bloquées — Chauffeurs
          </h2>

          {chauffeursAvecBlocages.length > 0 ? (
            chauffeursAvecBlocages.map((c) => (
              <div key={c.id} className="space-y-3 border-t border-phoebe-pearl pt-4 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium text-phoebe-anthracite">
                  {c.nom} ({c.telephone})
                </p>

                <BlocagesChauffeurList
                  blocages={c.blocages}
                  vehiculeId={id}
                />

                <BlocageChauffeurForm chauffeurId={c.id} vehiculeId={id} />
              </div>
            ))
          ) : (
            <p className="text-sm text-phoebe-anthracite/50">
              L'option chauffeur est activée mais aucun chauffeur n'est affecté
              à ce véhicule. Affectez un ou plusieurs chauffeurs via le
              formulaire de modification pour gérer leurs disponibilités.
            </p>
          )}
        </section>
        </ScrollReveal>
      )}
    </div>
  );
}
