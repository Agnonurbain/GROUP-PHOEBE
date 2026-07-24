"use client";

import Image from "next/image";
import { useActionState, useTransition } from "react";
import {
  ajouterPhotos,
  supprimerPhoto,
  reordonnerPhoto,
  type VehiculeState,
} from "@/app/actions/vehicules";
import { SubmitButton } from "@/components/submit-button";

type Photo = {
  id: string;
  url: string;
  ordre: number;
};

export default function PhotosManager({
  vehiculeId,
  photos,
}: {
  vehiculeId: string;
  photos: Photo[];
}) {
  const [isPending, startTransition] = useTransition();
  const [uploadState, uploadAction] = useActionState<VehiculeState, FormData>(
    ajouterPhotos,
    {}
  );

  const handleDelete = (photoId: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    startTransition(async () => {
      await supprimerPhoto(photoId);
    });
  };

  const handleMove = (photoId: string, direction: "up" | "down") => {
    startTransition(async () => {
      await reordonnerPhoto(photoId, direction);
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-phoebe-anthracite">Photos</h2>

      {uploadState.error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {uploadState.error}
        </div>
      )}

      <form action={uploadAction} className="flex items-end gap-3">
        <input type="hidden" name="vehicule_id" value={vehiculeId} />
        <div className="flex-1">
          <input
            type="file"
            name="photos"
            multiple
            accept="image/*"
            required
            className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-phoebe-pearl file:px-3 file:py-2 file:text-sm file:text-phoebe-anthracite"
          />
        </div>
        <SubmitButton>Ajouter</SubmitButton>
      </form>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-phoebe-pearl"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(photo.id, "up")}
                    disabled={index === 0 || isPending}
                    className="rounded bg-white/20 px-2 py-0.5 text-xs text-white hover:bg-white/40 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(photo.id, "down")}
                    disabled={index === photos.length - 1 || isPending}
                    className="rounded bg-white/20 px-2 py-0.5 text-xs text-white hover:bg-white/40 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  disabled={isPending}
                  className="rounded bg-error/80 px-2 py-0.5 text-xs text-white hover:bg-error disabled:opacity-30"
                >
                  Supprimer
                </button>
              </div>
              <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-phoebe-anthracite/70">
          Aucune photo pour ce véhicule.
        </p>
      )}
    </section>
  );
}
