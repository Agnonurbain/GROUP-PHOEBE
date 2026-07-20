import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { FavoriButton } from "@/components/favori-button";
import { BackLink } from "@/components/back-link";
import { ScrollReveal } from "@/components/effects";

function formatPrice(val: number | null): string | null {
  if (!val) return null;
  return `${Number(val).toLocaleString("fr-FR")} FCFA`;
}

export default async function FavorisPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  const { data: favs } = await supabase
    .from("favoris")
    .select("vehicule_id")
    .eq("user_id", user!.sub);

  const vehiculeIds = favs?.map((f) => f.vehicule_id) ?? [];

  const { data: vehicules } = vehiculeIds.length
    ? await supabase.from("vehicules").select("*").in("id", vehiculeIds)
    : { data: [] };

  const { data: allPhotos } = vehiculeIds.length
    ? await supabase
        .from("vehicule_photos")
        .select("vehicule_id, url")
        .in("vehicule_id", vehiculeIds)
        .order("ordre", { ascending: true })
    : { data: [] };

  const firstPhoto = new Map<string, string>();
  for (const p of allPhotos ?? []) {
    if (!firstPhoto.has(p.vehicule_id)) firstPhoto.set(p.vehicule_id, p.url);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <BackLink href="/profil" label="Mon profil" />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-phoebe-anthracite">
          Mes <span className="text-gradient-gold">favoris</span>
        </h1>
      </div>

      {vehicules && vehicules.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {vehicules.map((v, i) => {
            const photo = firstPhoto.get(v.id);

            return (
              <ScrollReveal key={v.id} variant="fade-up" delay={i * 0.1}>
              <div
                className="group relative flex gap-4 rounded-2xl border border-phoebe-pearl bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-phoebe-gold/20 overflow-hidden"
              >
                {/* Gold top-border reveal on hover */}
                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-phoebe-gold/0 via-phoebe-gold to-phoebe-gold/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Link href={`/catalogue/${v.id}`} className="shrink-0">
                  {photo ? (
                    <div className="relative h-28 w-36 overflow-hidden rounded-xl">
                      <Image
                        src={photo}
                        alt={`${v.marque} ${v.modele}`}
                        fill
                        sizes="144px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-36 items-center justify-center rounded-xl bg-phoebe-pearl text-xs text-phoebe-anthracite/30">
                      Pas de photo
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                  <div>
                    <Link href={`/catalogue/${v.id}`}>
                      <h2 className="font-bold text-phoebe-anthracite transition-colors hover:text-phoebe-green">
                        {v.marque} {v.modele}
                        {v.annee ? ` (${v.annee})` : ""}
                      </h2>
                    </Link>
                    <p className="mt-0.5 text-sm text-phoebe-anthracite/45">
                      {v.localisation ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-bold text-phoebe-gold">
                      {formatPrice(v.prix_journalier) ?? "—"}
                      <span className="font-normal text-phoebe-anthracite/45">
                        /jour
                      </span>
                    </span>
                    <FavoriButton vehiculeId={v.id} isFavori={true} />
                  </div>
                </div>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-phoebe-pearl bg-white py-16 text-center shadow-sm animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-phoebe-pearl/60">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-phoebe-anthracite/25">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-phoebe-anthracite">Aucun favori pour le moment</p>
            <p className="mt-1 text-sm text-phoebe-anthracite/40">
              Ajoutez des véhicules à vos favoris en cliquant sur le cœur {" "}
              <span className="text-phoebe-anthracite/30">&lt;3</span>.
            </p>
          </div>
          <Link
            href="/catalogue"
            className="rounded-2xl bg-phoebe-green px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-phoebe-green-deep"
          >
            Parcourir le catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
