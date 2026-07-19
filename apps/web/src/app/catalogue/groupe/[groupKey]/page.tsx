import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { AjouterPanierButton } from "@/components/ajouter-panier-button";
import { DemandeAchatForm } from "@/components/demande-achat-form";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey, groupVehicles } from "@/lib/vehicle-group";
import { CAT_LABELS } from "@/lib/constants";
import { ScrollReveal, ParallaxImage } from "@/components/effects";


function formatPrice(val: number | null): string | null {
  if (!val) return null;
  return `${Number(val).toLocaleString("fr-FR")} FCFA`;
}

export default async function GroupeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupKey: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { groupKey: rawKey } = await params;
  const groupKey = decodeURIComponent(rawKey);
  const sp = await searchParams;
  const mode = sp.mode as "location" | "achat" | undefined;

  if (!mode) {
    redirect(`/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`);
  }

  const supabase = await createClient();

  const { data: allVehicules } = await supabase
    .from("vehicules")
    .select("*")
    .neq("statut", "indisponible")
    .neq("statut", "reserve");

  if (!allVehicules || allVehicules.length === 0) notFound();

  const vehicules = allVehicules.filter(
    (v) => makeGroupKey(v.marque, v.modele) === groupKey
  );

  if (vehicules.length === 0) notFound();

  const ids = vehicules.map((v) => v.id);

  const { data: allPhotos } = await supabase
    .from("vehicule_photos")
    .select("vehicule_id, url, id")
    .in("vehicule_id", ids)
    .order("ordre", { ascending: true });

  const photoMap = new Map<string, string>();
  for (const p of allPhotos ?? []) {
    if (!photoMap.has(p.vehicule_id)) photoMap.set(p.vehicule_id, p.url);
  }

  const groups = groupVehicles(vehicules as Parameters<typeof groupVehicles>[0], photoMap);
  const group = groups[0];
  if (!group) notFound();

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect(`/inscription?redirect=/catalogue/groupe/${encodeURIComponent(groupKey)}?mode=${mode}`);
  }

  const rep = vehicules[0];

  const { data: intervalles } = await supabase
    .from("intervalles_prix")
    .select("*, zones_tarifaires!inner(nom, ordre)")
    .eq("categorie_vehicule", rep.categorie)
    .eq("type", mode === "achat" ? "vente" : "location")
    .order("ordre", { referencedTable: "zones_tarifaires", ascending: true });

  const mainPhotos = allPhotos?.filter((p) => p.vehicule_id === group.representativeId) ?? [];
  const mainPhoto = mainPhotos[0]?.url;
  const extraPhotos = mainPhotos.slice(1);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <Link
          href="/catalogue"
          className="group mb-6 inline-flex items-center gap-1.5 text-sm text-phoebe-anthracite/50 transition-colors hover:text-phoebe-green"
        >
          <span className="inline-block transition-transform group-hover:-translate-x-1">&larr;</span>
          Retour au catalogue
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Photos */}
          <ScrollReveal variant="fade-up">
          <div className="space-y-4">
            {mainPhoto ? (
              <>
                <ParallaxImage
                  src={mainPhoto}
                  alt={`${group.marque} ${group.modele}`}
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full rounded-2xl shadow-lg ring-1 ring-black/5"
                />
                {extraPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {extraPhotos.map((p) => (
                      <div key={p.id} className="group/thumb relative aspect-square overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md cursor-pointer">
                        <Image
                          src={p.url}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 25vw, 12vw"
                          className="object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-phoebe-pearl text-phoebe-anthracite/30 ring-1 ring-black/5">
                Pas de photo
              </div>
            )}
          </div>
          </ScrollReveal>

          {/* Infos */}
          <div className="space-y-7">
            <ScrollReveal variant="fade-up" delay={0.1}>
            <div>
              <div className="flex items-center gap-2.5 text-xs">
                <Link
                  href={`/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`}
                  className="group/switch rounded-full border border-phoebe-anthracite/15 px-3.5 py-1.5 text-phoebe-anthracite/50 transition-all hover:border-phoebe-green hover:text-phoebe-green hover:shadow-sm"
                >
                  <span className="inline-block transition-transform group-hover/switch:-translate-x-0.5">&larr;</span> Changer (Achat / Location)
                </Link>
                <span className={`rounded-full px-3.5 py-1.5 font-semibold ${mode === "location" ? "bg-phoebe-green/10 text-phoebe-green-deep" : "bg-phoebe-gold/10 text-phoebe-gold"}`}>
                  {mode === "location" ? "Location" : "Achat"}
                </span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-phoebe-anthracite">
                  {group.marque} {group.modele}
                </h1>
                {group.totalCount > 0 && (
                  <span className="rounded-full bg-phoebe-green/10 px-3.5 py-1.5 text-sm font-semibold text-phoebe-green-deep">
                    {group.totalCount} disponible{group.totalCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-phoebe-anthracite/50">
                {CAT_LABELS[group.categorie] ?? group.categorie}
                {group.annee && group.annee < 9999 ? ` · ${group.annee}` : ""}
                {group.nbPlaces ? ` · ${group.nbPlaces} places` : ""}
              </p>
            </div>
            </ScrollReveal>

            {/* Tarifs par zone (location uniquement) */}
            {mode === "location" && intervalles && intervalles.length > 0 && (
              <ScrollReveal variant="fade-up" delay={0.2}>
              <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/40">
                  {mode === "location" ? "Tarifs indicatifs par zone" : "Prix indicatifs"}
                </h2>
                <div className="divide-y divide-phoebe-pearl/70">
                  {intervalles.map((ip) => (
                    <div key={ip.id} className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-sm text-phoebe-anthracite/70">
                        {(ip.zones_tarifaires as { nom: string }).nom}
                      </span>
                      <span className={`text-base font-bold ${mode === "location" ? "text-phoebe-green" : "text-gradient-gold"}`}>
                        {formatPrice(ip.prix_min)} — {formatPrice(ip.prix_max)}
                        {mode === "location" && <span className="text-xs font-normal text-phoebe-anthracite/50"> /jour</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-phoebe-anthracite/40">
                  Prix approximatifs selon la zone de destination. Le tarif final dépend de la distance et de la durée.
                </p>
                {group.chauffeurDisponible && (
                  <p className="mt-3 rounded-xl bg-phoebe-green/5 px-4 py-2.5 text-sm font-medium text-phoebe-green-deep">
                    Option chauffeur disponible — supplément tarifaire applicable.
                  </p>
                )}
              </div>
              </ScrollReveal>
            )}

            {/* Assurance */}
            {group.assurance && (
              <ScrollReveal variant="fade-up" delay={0.25}>
              <div className="flex items-center gap-4 rounded-2xl border border-phoebe-green/10 bg-phoebe-green/5 px-5 py-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-phoebe-green">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-phoebe-green-deep">Vehicule assure</p>
                  <p className="text-xs text-phoebe-anthracite/50">Ce vehicule est couvert par une assurance tous risques.</p>
                </div>
              </div>
              </ScrollReveal>
            )}

            {/* CTA Location */}
            {mode === "location" && group.prixJournalier > 0 && group.totalCount > 0 && (
              <ScrollReveal variant="scale-in" delay={0.3}>
              <AjouterPanierButton
                vehicule={{
                  groupKey: group.groupKey,
                  marque: group.marque,
                  modele: group.modele,
                  categorie: group.categorie,
                  prixJournalier: group.prixJournalier,
                  tauxCaution: group.tauxCaution,
                  chauffeurDisponible: group.chauffeurDisponible,
                  quantite: 1,
                  maxDisponible: group.totalCount,
                  photoUrl: group.photoUrl,
                }}
              />
              </ScrollReveal>
            )}

            {/* CTA Achat */}
            {mode === "achat" && group.totalCount > 0 && (() => {
              const dispos = vehicules.filter((v) => v.statut === "disponible" && v.prix_vente);
              const target = dispos[0] ?? vehicules[0];
              const prix = dispos.length > 0
                ? Math.min(...dispos.map((v) => Number(v.prix_vente)))
                : null;
              return (
                <ScrollReveal variant="scale-in" delay={0.3}>
                <DemandeAchatForm
                  vehiculeId={target.id}
                  marque={group.marque}
                  modele={group.modele}
                  categorie={group.categorie}
                  prixVente={prix}
                  etat={target.etat ?? "occasion"}
                />
                </ScrollReveal>
              );
            })()}

            {/* Caractéristiques */}
            <ScrollReveal variant="fade-up" delay={0.35}>
            <div className="rounded-2xl border border-phoebe-pearl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-phoebe-anthracite/40">
                Caracteristiques
              </h2>
              <dl className="divide-y divide-phoebe-pearl/70 text-sm">
                {group.nbPlaces && (
                  <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-phoebe-anthracite/60">Places</dt>
                    <dd className="font-semibold text-phoebe-anthracite">{group.nbPlaces}</dd>
                  </div>
                )}
                {group.boite && (
                  <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-phoebe-anthracite/60">Boite</dt>
                    <dd className="font-semibold text-phoebe-anthracite">
                      {group.boite === "automatique" ? "Automatique" : "Manuelle"}
                    </dd>
                  </div>
                )}
                {mode === "achat" ? (
                  <>
                    {rep.etat && (
                      <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                        <dt className="text-phoebe-anthracite/60">Etat</dt>
                        <dd className="font-semibold text-phoebe-anthracite capitalize">{rep.etat === "neuf" ? "Neuf" : "Occasion"}</dd>
                      </div>
                    )}
                    {rep.carburant && (
                      <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                        <dt className="text-phoebe-anthracite/60">Carburant</dt>
                        <dd className="font-semibold text-phoebe-anthracite capitalize">{rep.carburant}</dd>
                      </div>
                    )}
                    {rep.kilometrage != null && rep.kilometrage > 0 && (
                      <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                        <dt className="text-phoebe-anthracite/60">Kilometrage</dt>
                        <dd className="font-semibold text-phoebe-anthracite">{Number(rep.kilometrage).toLocaleString("fr-FR")} km</dd>
                      </div>
                    )}
                    {rep.localisation && (
                      <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                        <dt className="text-phoebe-anthracite/60">Localisation</dt>
                        <dd className="font-semibold text-phoebe-anthracite">{rep.localisation}</dd>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                      <dt className="text-phoebe-anthracite/60">Climatisation</dt>
                      <dd className="font-semibold text-phoebe-anthracite">{group.climatisation ? "Oui" : "Non"}</dd>
                    </div>
                    <div className="flex items-baseline justify-between py-2.5 first:pt-0 last:pb-0">
                      <dt className="text-phoebe-anthracite/60">GPS</dt>
                      <dd className="font-semibold text-phoebe-anthracite">{group.gps ? "Oui" : "Non"}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </main>
    </>
  );
}
