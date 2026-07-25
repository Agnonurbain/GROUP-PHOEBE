"use client"

import { useEffect, useState } from "react"

// Aperçu inline d'un document (pièce d'identité, permis…) : image affichée dans
// une modale, PDF rendu via une iframe (visionneuse native du navigateur).
export function DocumentPreview({
  url,
  label,
  isPdf = false,
  className,
}: {
  url: string
  label: string
  isPdf?: boolean
  /** Style du déclencheur (couleur adaptée au contexte clair/sombre). */
  className?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "inline-flex items-center gap-1.5 text-sm underline"}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {isPdf ? (
            <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </>
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </>
          )}
        </svg>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
              <span className="text-sm font-semibold text-phoebe-anthracite">{label}</span>
              <div className="flex items-center gap-3">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-phoebe-green underline hover:text-phoebe-green-deep">
                  Ouvrir dans un onglet
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-anthracite"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 bg-phoebe-pearl/30">
              {isPdf ? (
                <iframe src={url} title={label} className="h-full w-full" />
              ) : (
                <div className="flex h-full items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
