import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { AjouterPanierButton } from "@/components/ajouter-panier-button";
import { DemandeAchatForm } from "@/components/demande-achat-form";
import { createClient } from "@/lib/supabase/server";
import { makeGroupKey, groupVehicles } from "@/lib/vehicle-group";
import { CAT_LABELS } from "@/lib/constants";


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
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/catalogue"
          className="mb-4 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          &larr; Retour au catalogue
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photos */}
          <div className="space-y-3">
            {mainPhoto ? (
              <>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <Image
                    src={mainPhoto}
                    alt={`${group.marque} ${group.modele}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </div>
                {extraPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {extraPhotos.map((p) => (
                      <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={p.url}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 25vw, 12vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-phoebe-pearl text-phoebe-anthracite/30">
                Pas de photo
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href={`/catalogue/groupe/${encodeURIComponent(groupKey)}/choix`}
                  className="rounded-full border border-phoebe-anthracite/20 px-3 py-1 text-phoebe-anthracite/60 transition-colors hover:border-phoebe-green hover:text-phoebe-green"
                >
                  &larr; Changer (Achat / Location)
                </Link>
                <span className={`rounded-full px-3 py-1 font-medium ${mode === "location" ? "bg-phoebe-green/10 text-phoebe-green-deep" : "bg-phoebe-gold/10 text-phoebe-gold"}`}>
                  {mode === "location" ? "Location" : "Achat"}
                </span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-phoebe-anthracite">
                  {group.marque} {group.modele}
                </h1>
                {group.totalCount > 0 && (
                  <span className="rounded-full bg-phoebe-green/10 px-3 py-1 text-sm font-medium text-phoebe-green-deep">
                    {group.totalCount} disponible{group.totalCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-phoebe-anthracite/50">
                {CAT_LABELS[group.categorie] ?? group.categorie}
                {group.annee && group.annee < 9999 ? ` · ${group.annee}` : ""}
                {group.nbPlaces ? ` · ${group.nbPlaces} places` : ""}
              </p>
            </div>

            {/* Tarifs par zone (location uniquement) */}
            {mode === "location" && intervalles && intervalles.length > 0 && (
              <div className="rounded-xl bg-phoebe-pearl p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                  {mode === "location" ? "Tarifs indicatifs par zone" : "Prix indicatifs"}
                </h2>
                <div className="space-y-2">
                  {intervalles.map((ip) => (
                    <div key={ip.id} className="flex items-baseline justify-between">
                      <span className="text-sm text-phoebe-anthracite/70">
                        {(ip.zones_tarifaires as { nom: string }).nom}
                      </span>
                      <span className={`font-semibold ${mode === "location" ? "text-phoebe-green" : "text-phoebe-gold"}`}>
                        {formatPrice(ip.prix_min)} — {formatPrice(ip.prix_max)}
                        {mode === "location" && <span className="text-xs font-normal text-phoebe-anthracite/50"> /jour</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-phoebe-anthracite/40">
                  Prix approximatifs selon la zone de destination. Le tarif final dépend de la distance et de la durée.
                </p>
                {group.chauffeurDisponible && (
                  <p className="mt-2 rounded-lg bg-phoebe-green/10 px-3 py-2 text-sm text-phoebe-green-deep">
                    Option chauffeur disponible — supplément tarifaire applicable.
                  </p>
                )}
              </div>
            )}

            {/* Assurance */}
            {group.assurance && (
              <div className="flex items-center gap-3 rounded-xl bg-phoebe-green/5 px-4 py-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-phoebe-green">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-phoebe-green-deep">Véhicule assuré</p>
                  <p className="text-xs text-phoebe-anthracite/50">Ce véhicule est couvert par une assurance tous risques.</p>
                </div>
              </div>
            )}

            {/* CTA Location */}
            {mode === "location" && group.prixJournalier > 0 && group.totalCount > 0 && (
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
            )}

            {/* CTA Achat */}
            {mode === "achat" && group.totalCount > 0 && (() => {
              const dispos = vehicules.filter((v) => v.statut === "disponible" && v.prix_vente);
              const target = dispos[0] ?? vehicules[0];
              const prix = dispos.length > 0
                ? Math.min(...dispos.map((v) => Number(v.prix_vente)))
                : null;
              return (
                <DemandeAchatForm
                  vehiculeId={target.id}
                  marque={group.marque}
                  modele={group.modele}
                  categorie={group.categorie}
                  prixVente={prix}
                  etat={target.etat ?? "occasion"}
                />
              );
            })()}

            {/* Caractéristiques */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {group.nbPlaces && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Places</dt>
                    <dd className="font-medium text-phoebe-anthracite">{group.nbPlaces}</dd>
                  </>
                )}
                {group.boite && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Boîte</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {group.boite === "automatique" ? "Automatique" : "Manuelle"}
                    </dd>
                  </>
                )}
                {mode === "achat" ? (
                  <>
                    {rep.etat && (
                      <>
                        <dt className="text-phoebe-anthracite/60">État</dt>
                        <dd className="font-medium text-phoebe-anthracite capitalize">{rep.etat === "neuf" ? "Neuf" : "Occasion"}</dd>
                      </>
                    )}
                    {rep.carburant && (
                      <>
                        <dt className="text-phoebe-anthracite/60">Carburant</dt>
                        <dd className="font-medium text-phoebe-anthracite capitalize">{rep.carburant}</dd>
                      </>
                    )}
                    {rep.kilometrage != null && rep.kilometrage > 0 && (
                      <>
                        <dt className="text-phoebe-anthracite/60">Kilométrage</dt>
                        <dd className="font-medium text-phoebe-anthracite">{Number(rep.kilometrage).toLocaleString("fr-FR")} km</dd>
                      </>
                    )}
                    {rep.localisation && (
                      <>
                        <dt className="text-phoebe-anthracite/60">Localisation</dt>
                        <dd className="font-medium text-phoebe-anthracite">{rep.localisation}</dd>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <dt className="text-phoebe-anthracite/60">Climatisation</dt>
                    <dd className="font-medium text-phoebe-anthracite">{group.climatisation ? "Oui" : "Non"}</dd>
                    <dt className="text-phoebe-anthracite/60">GPS</dt>
                    <dd className="font-medium text-phoebe-anthracite">{group.gps ? "Oui" : "Non"}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
