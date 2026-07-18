import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { FavoriButton } from "@/components/favori-button";
import { DisponibiliteChecker } from "@/components/disponibilite-checker";
import { AjouterPanierButton } from "@/components/ajouter-panier-button";
import { DemandeAchatForm } from "@/components/demande-achat-form";
import { createClient } from "@/lib/supabase/server";
import { expirerReservationsAbandonnees } from "@/lib/payments/expiration";
import { makeGroupKey } from "@/lib/vehicle-group";

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  disponible: {
    label: "Disponible",
    color: "bg-phoebe-green/10 text-phoebe-green-deep",
  },
  loue: { label: "Loué", color: "bg-blue-50 text-blue-700" },
  vendu: {
    label: "Vendu",
    color: "bg-phoebe-anthracite/10 text-phoebe-anthracite",
  },
};

const CAT_LABELS: Record<string, string> = {
  leger: "Véhicule léger",
  car: "Car",
  minibus: "Minibus",
};

const CARBURANT_LABELS: Record<string, string> = {
  vide: "Vide",
  quart: "¼",
  demi: "½",
  trois_quarts: "¾",
  plein: "Plein",
};

function formatPrice(val: number | null): string | null {
  if (!val) return null;
  return `${Number(val).toLocaleString("fr-FR")} FCFA`;
}

export default async function VehiculeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const mode = sp.mode as "location" | "achat" | undefined;

  if (!mode) {
    redirect(`/catalogue/${id}/choix`);
  }

  await expirerReservationsAbandonnees();
  const supabase = await createClient();

  const { data: v } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (!v || v.statut === "indisponible" || v.statut === "reserve") notFound();

  const { count: siblingsCount } = await supabase
    .from("vehicules")
    .select("id", { count: "exact", head: true })
    .eq("marque", v.marque)
    .eq("modele", v.modele)
    .eq("statut", "disponible");

  const maxDisponible = siblingsCount ?? 1;

  const { data: photos } = await supabase
    .from("vehicule_photos")
    .select("*")
    .eq("vehicule_id", id)
    .order("ordre", { ascending: true });

  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect(`/inscription?redirect=/catalogue/${id}/choix`);
  }

  let isFavori = false;
  if (user) {
    const { data } = await supabase
      .from("favoris")
      .select("id")
      .eq("user_id", user.sub)
      .eq("vehicule_id", id)
      .maybeSingle();
    isFavori = !!data;
  }

  const { data: avisData } = await supabase
    .from("avis_transport")
    .select("note, demandes_transport!inner(vehicule_id)")
    .eq("demandes_transport.vehicule_id", id);

  const avisNotes = avisData?.map((a) => Number(a.note)) ?? [];
  const moyenneAvis =
    avisNotes.length > 0
      ? avisNotes.reduce((s, n) => s + n, 0) / avisNotes.length
      : null;

  const { data: intervalles } = await supabase
    .from("intervalles_prix")
    .select("*, zones_tarifaires!inner(nom, ordre)")
    .eq("categorie_vehicule", v.categorie)
    .eq("type", mode === "achat" ? "vente" : "location")
    .order("ordre", { referencedTable: "zones_tarifaires", ascending: true });

  const s = STATUT_LABELS[v.statut];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/catalogue"
          className="mb-4 inline-block text-sm text-phoebe-anthracite/60 hover:text-phoebe-green"
        >
          ← Retour au catalogue
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Photos */}
          <div className="space-y-3">
            {photos && photos.length > 0 ? (
              <>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                  <Image
                    src={photos[0].url}
                    alt={`${v.marque} ${v.modele}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </div>
                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.slice(1).map((p) => (
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
                  href={`/catalogue/${v.id}/choix`}
                  className="rounded-full border border-phoebe-anthracite/20 px-3 py-1 text-phoebe-anthracite/60 transition-colors hover:border-phoebe-green hover:text-phoebe-green"
                >
                  ← Changer (Achat / Location)
                </Link>
                <span className={`rounded-full px-3 py-1 font-medium ${mode === "location" ? "bg-phoebe-green/10 text-phoebe-green-deep" : "bg-phoebe-gold/10 text-phoebe-gold"}`}>
                  {mode === "location" ? "Location" : "Achat"}
                </span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-phoebe-anthracite">
                  {v.marque} {v.modele}
                </h1>
                <div className="flex items-center gap-2">
                  {s && (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${s.color}`}
                    >
                      {s.label}
                    </span>
                  )}
                  {user && (
                    <FavoriButton vehiculeId={v.id} isFavori={isFavori} />
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-phoebe-anthracite/50">
                {CAT_LABELS[v.categorie] ?? v.categorie}
                {v.annee ? ` · ${v.annee}` : ""}
                {moyenneAvis !== null && (
                  <span className="ml-2 inline-flex items-center gap-1" aria-label={`Note : ${moyenneAvis.toFixed(1)} sur 5`}>
                    <span className="inline-flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.round(moyenneAvis) ? "#D38C37" : "none"} stroke="#D38C37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </span>
                    <span>{moyenneAvis.toFixed(1)}/5 ({avisNotes.length} avis)</span>
                  </span>
                )}
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
                {v.chauffeur_disponible && (
                  <p className="mt-2 rounded-lg bg-phoebe-green/10 px-3 py-2 text-sm text-phoebe-green-deep">
                    Option chauffeur disponible — supplément tarifaire applicable.
                  </p>
                )}
              </div>
            )}

            {/* Assurance */}
            {v.assurance_url && (
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

            {/* Caméra de sécurité */}
            {v.camera_interieure && (
              <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-blue-600">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-700">Caméra intérieure de sécurité</p>
                  <p className="text-xs text-phoebe-anthracite/50">Ce véhicule est équipé d&apos;une caméra de surveillance intérieure pour la sécurité de tous.</p>
                </div>
              </div>
            )}

            {/* Disponibilité checker (location uniquement) */}
            {mode === "location" &&
              (v.prix_journalier || v.prix_mensuel) &&
              v.statut !== "vendu" && (
                <DisponibiliteChecker
                  vehiculeId={v.id}
                  chauffeurDisponible={v.chauffeur_disponible}
                />
              )}

            {/* CTA */}
            {mode === "location" && v.prix_journalier && v.statut === "disponible" && (
              <AjouterPanierButton
                vehicule={{
                  groupKey: makeGroupKey(v.marque, v.modele),
                  marque: v.marque,
                  modele: v.modele,
                  categorie: v.categorie,
                  prixJournalier: Number(v.prix_journalier),
                  tauxCaution: v.taux_caution ? Number(v.taux_caution) : 0.3,
                  chauffeurDisponible: v.chauffeur_disponible,
                  quantite: 1,
                  maxDisponible,
                  photoUrl: photos?.[0]?.url ?? null,
                }}
              />
            )}

            {mode === "achat" && v.statut === "disponible" && (
              <DemandeAchatForm
                vehiculeId={v.id}
                marque={v.marque}
                modele={v.modele}
                categorie={v.categorie}
                prixVente={v.prix_vente ? Number(v.prix_vente) : null}
              />
            )}

            {/* Caractéristiques */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                Caractéristiques
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {v.nb_places && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Places</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.nb_places}
                    </dd>
                  </>
                )}
                {v.boite && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Boîte</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.boite === "automatique" ? "Automatique" : "Manuelle"}
                    </dd>
                  </>
                )}
                {v.carburant && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Carburant</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.carburant}
                    </dd>
                  </>
                )}
                {v.kilometrage != null && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Kilométrage</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {Number(v.kilometrage).toLocaleString("fr-FR")} km
                    </dd>
                  </>
                )}
                <dt className="text-phoebe-anthracite/60">Climatisation</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {v.climatisation ? "Oui" : "Non"}
                </dd>
                <dt className="text-phoebe-anthracite/60">GPS</dt>
                <dd className="font-medium text-phoebe-anthracite">
                  {v.gps ? "Oui" : "Non"}
                </dd>
                {v.niveau_carburant && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Niveau carburant</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {CARBURANT_LABELS[v.niveau_carburant] ?? v.niveau_carburant}
                    </dd>
                  </>
                )}
                {v.localisation && (
                  <>
                    <dt className="text-phoebe-anthracite/60">Localisation</dt>
                    <dd className="font-medium text-phoebe-anthracite">
                      {v.localisation}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {/* Description */}
            {v.description && (
              <div>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-phoebe-anthracite/40">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-phoebe-anthracite/80">
                  {v.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
