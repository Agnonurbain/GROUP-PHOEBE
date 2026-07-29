"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/shadcn/dialog"

interface VehicleGalleryProps {
  photos: { url: string }[]
  alt: string
  accentColor?: "orange" | "green" | "gold" | "blue"
}

export function VehicleGallery({ photos, alt, accentColor = "orange" }: VehicleGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const next = useCallback(() => setSelected((s) => (s + 1) % photos.length), [photos.length])
  const prev = useCallback(() => setSelected((s) => (s - 1 + photos.length) % photos.length), [photos.length])

  // Le Dialog gère Échap et le piège de focus ; restent les flèches.
  useEffect(() => {
    if (!zoomOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [zoomOpen, next, prev])

  const borderAccent = {
    orange: "border-accent-orange",
    green: "border-accent-green",
    gold: "border-accent-gold",
    blue: "border-accent-blue",
  }[accentColor]

  // Sans photo, l'ancienne version ne rendait RIEN : la fiche avait un trou.
  // Un cadre explicite vaut mieux qu'une absence inexpliquée.
  if (photos.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-public-border bg-public-bg-card">
        <ImageOff className="size-7 text-public-text-faint" aria-hidden="true" />
        <p className="text-sm text-public-text-muted">Photo bientôt disponible</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Agrandir la photo de ${alt}`}
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
                aria-label={`Voir la photo ${i + 1} sur ${photos.length}`}
                aria-current={i === selected}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === selected
                    ? `${borderAccent} opacity-100`
                    : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialog shadcn : l'ancien calque fait main n'avait ni piège de focus, ni
          rôle ARIA, ni blocage du défilement — au clavier on sortait du modal
          sans le savoir. */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          showCloseButton
          className="max-w-5xl border-none bg-transparent p-0 shadow-none sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">
            {alt} — photo {selected + 1} sur {photos.length}
          </DialogTitle>

          <div className="relative h-[80vh] w-full">
            <Image
              src={photos[selected].url}
              alt={alt}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Photo précédente"
                className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Photo suivante"
                className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
              >
                <ChevronRight className="size-5" />
              </button>
              <p
                aria-live="polite"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white"
              >
                {selected + 1} / {photos.length}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
