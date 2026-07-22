"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"

interface VehicleGalleryProps {
  photos: { url: string }[]
  alt: string
}

export function VehicleGallery({ photos, alt }: VehicleGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const next = useCallback(() => setSelected((s) => (s + 1) % photos.length), [photos.length])
  const prev = useCallback(() => setSelected((s) => (s - 1 + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!zoomOpen) return
      if (e.key === "Escape") setZoomOpen(false)
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoomOpen, next, prev])

  if (photos.length === 0) return null

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="relative aspect-video w-full overflow-hidden rounded-2xl bg-public-bg-card"
        >
          <Image
            src={photos[selected].url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
          />
        </button>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => setSelected(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === selected ? "border-accent-orange opacity-100" : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <Image src={p.url} alt={`${alt} — ${i + 1}`} fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            aria-label="Photo précédente"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            aria-label="Photo suivante"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomOpen(false) }}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>
          <div className="relative h-[80vh] w-[90vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[selected].url}
              alt={alt}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {selected + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}
