import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { FavoriButton } from "@/components/favori-button";
import { BackLink } from "@/components/back-link";

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
        <h1 className="mt-3 text-3xl font-bold text-phoebe-anthracite">
          Mes favoris
        </h1>
      </div>

      {vehicules && vehicules.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {vehicules.map((v) => {
            const photo = firstPhoto.get(v.id);

            return (
              <div
                key={v.id}
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
                    <span className="text-sm font-bold text-phoebe-green">
                      {formatPrice(v.prix_journalier) ?? "—"}
                      <span className="font-normal text-phoebe-anthracite/45">
                        /jour
                      </span>
                    </span>
                    <FavoriButton vehiculeId={v.id} isFavori={true} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-phoebe-pearl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-phoebe-anthracite/45">
            Vous n&apos;avez pas encore de favoris.{" "}
            <Link
              href="/catalogue"
              className="font-medium text-phoebe-green hover:text-phoebe-green-deep"
            >
              Parcourir le catalogue
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
