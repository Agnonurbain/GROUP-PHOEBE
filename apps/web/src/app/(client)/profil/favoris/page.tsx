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
    <div className="space-y-6">
      <div>
        <BackLink href="/profil" label="Mon profil" />
        <h1 className="mt-2 text-2xl font-bold text-phoebe-anthracite">
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
                className="flex gap-4 rounded-xl border border-phoebe-pearl bg-white p-3"
              >
                <Link href={`/catalogue/${v.id}`} className="shrink-0">
                  {photo ? (
                    <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                      <Image
                        src={photo}
                        alt={`${v.marque} ${v.modele}`}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-32 items-center justify-center rounded-lg bg-phoebe-pearl text-xs text-phoebe-anthracite/30">
                      Pas de photo
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/catalogue/${v.id}`}>
                      <h2 className="font-semibold text-phoebe-anthracite hover:text-phoebe-green">
                        {v.marque} {v.modele}
                        {v.annee ? ` (${v.annee})` : ""}
                      </h2>
                    </Link>
                    <p className="text-sm text-phoebe-anthracite/60">
                      {v.localisation ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold text-phoebe-green">
                      {formatPrice(v.prix_journalier) ?? "—"}
                      <span className="font-normal text-phoebe-anthracite/50">
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
        <p className="text-sm text-phoebe-anthracite/50">
          Vous n&apos;avez pas encore de favoris.{" "}
          <Link
            href="/catalogue"
            className="text-phoebe-green hover:text-phoebe-green-deep"
          >
            Parcourir le catalogue
          </Link>
        </p>
      )}
    </div>
  );
}
