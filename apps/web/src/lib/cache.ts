import { unstable_cache } from "next/cache";

export function createCacheFetcher<T>(
  key: string[],
  fetcher: () => Promise<T>,
  revalidate = 3600,
  tags: string[] = []
) {
  return unstable_cache(fetcher, key, {
    revalidate,
    tags,
  });
}

export const cacheKeys = {
  zones: () => ["zones_tarifaires"] as const,
  tarifs: (zoneId: string) => ["tarifs", zoneId] as const,
  categories: () => ["categories_vehicules"] as const,
  communes: (zoneId: string) => ["communes", zoneId] as const,
  vehicules: (filters: string) => ["vehicules", filters] as const,
} as const;

export function revalidateTags(...tags: string[]) {
  if (typeof window === "undefined") {
    return import("next/cache").then(({ revalidateTag }) => {
      tags.forEach((tag) => (revalidateTag as (tag: string) => void)(tag));
    });
  }
  return Promise.resolve();
}