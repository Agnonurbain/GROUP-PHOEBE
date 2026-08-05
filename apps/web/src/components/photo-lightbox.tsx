"use client"

import { useCallback, useEffect, useState } from "react"
import { useT } from "@/lib/langue-context"

// Grille de vignettes + visionneuse (lightbox) au clic. Réutilisable en thème
// clair (admin) comme sombre (public) : l'overlay est toujours sombre.
export function PhotoLightbox({
  photos,
  thumbClassName = "h-16 w-16",
}: {
  photos: string[]
  thumbClassName?: string
}) {
  const t = useT()
  const [index, setIndex] = useState<number | null>(null)

  const close = useCallback(() => setIndex(null), [])
  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  )
  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length]
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [index, close, prev, next])

  if (photos.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className="group overflow-hidden rounded-lg"
            aria-label={`Agrandir la photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo du colis ${i + 1}`}
              className={`${thumbClassName} rounded-lg border border-black/10 object-cover transition-transform duration-200 group-hover:scale-105`}
            />
          </button>
        ))}
      </div>

      {index !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              aria-label={t.commun.precedent}
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[index]}
            alt={`Photo du colis ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />

          {photos.length > 1 && (
            <button
              type="button"
              aria-label="Suivant"
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          {photos.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
              {index + 1} / {photos.length}
            </span>
          )}
        </div>
      )}
    </>
  )
}
