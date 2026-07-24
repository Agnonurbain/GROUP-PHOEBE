"use client"

import { useState, useTransition, useRef, type FormEvent } from "react"
import Compressor from "compressorjs"
import { Card } from "@/components/ui"
import { soumettreDocuments, type VerificationState } from "@/app/actions/verification"


function compressFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file)
      return
    }
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      mimeType: "image/webp",
      success(result: Blob) {
        resolve(new File([result], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }))
      },
      error(err: Error) {
        reject(err)
      },
    })
  })
}

export function VerificationForm({ statut, motifRejet }: { statut?: string; motifRejet?: string | null }) {
  const [state, setState] = useState<VerificationState>({})
  const [isPending, startTransition] = useTransition()
  const [previewPiece, setPreviewPiece] = useState<string | null>(null)
  const [previewPermis, setPreviewPermis] = useState<string | null>(null)
  const [pieceFile, setPieceFile] = useState<File | null>(null)
  const [permisFile, setPermisFile] = useState<File | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  if (state.success) {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">Documents soumis</h1>
        <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/10 p-6">
          <p className="text-sm text-accent-green">
            Vos documents ont été envoyés avec succès. Notre équipe les vérifiera dans les plus brefs délais.
          </p>
        </div>
        <a href="/compte/profil" className="mt-4 inline-block rounded-lg bg-accent-gold px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover transition-colors">
          Retour au profil
        </a>
      </div>
    )
  }

  if (statut === "documents_soumis") {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">Vérification d&apos;identité</h1>
        <div className="mt-4 rounded-xl border border-accent-gold/30 bg-accent-gold/10 p-6">
          <p className="text-sm text-accent-gold">
            Vos documents sont en cours de vérification par notre équipe. Vous recevrez une notification dès qu&apos;ils seront traités.
          </p>
        </div>
        <a href="/compte/profil" className="mt-4 inline-block rounded-lg bg-accent-gold px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover transition-colors">
          Retour au profil
        </a>
      </div>
    )
  }

  if (statut === "verifie") {
    return (
      <div className="px-6 py-16">
        <h1 className="text-4xl font-bold text-public-text">Vérification d&apos;identité</h1>
        <div className="mt-4 rounded-xl border border-accent-green/30 bg-accent-green/10 p-6">
          <p className="text-sm font-medium text-accent-green">
            Votre identité est vérifiée. Vous pouvez effectuer des réservations.
          </p>
        </div>
        <a href="/compte/profil" className="mt-4 inline-block rounded-lg bg-accent-gold px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-accent-gold-hover transition-colors">
          Retour au profil
        </a>
      </div>
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pieceFile || !permisFile) return

    setState({})
    startTransition(async () => {
      try {
        const [compressedPiece, compressedPermis] = await Promise.all([
          compressFile(pieceFile),
          compressFile(permisFile),
        ])
        const fd = new FormData()
        fd.append("piece_identite", compressedPiece, compressedPiece.name)
        fd.append("permis_conduire", compressedPermis, compressedPermis.name)
        const result = await soumettreDocuments({}, fd)
        setState(result)
      } catch {
        setState({ error: "Erreur lors de la compression des images." })
      }
    })
  }

  function handlePieceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPieceFile(file)
    if (file) {
      setPreviewPiece(URL.createObjectURL(file))
    } else {
      setPreviewPiece(null)
    }
  }

  function handlePermisChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPermisFile(file)
    if (file) {
      setPreviewPermis(URL.createObjectURL(file))
    } else {
      setPreviewPermis(null)
    }
  }

  return (
    <div className="px-6 py-16">
      <h1 className="text-4xl font-bold text-public-text">Vérification d&apos;identité</h1>

      {statut === "rejete" && motifRejet && (
        <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] p-4">
          <p className="text-sm text-[#EF4444]">
            <strong>Motif du rejet :</strong> {motifRejet}
          </p>
          <p className="mt-2 text-sm text-public-text-muted">
            Veuillez soumettre à nouveau vos documents corrigés.
          </p>
        </div>
      )}

      <p className="mt-2 text-sm text-public-text-muted">
        Envoyez une photo de votre pi&egrave;ce d&apos;identit&eacute; et de votre permis de
        conduire. Formats accept&eacute;s : JPG, PNG, WebP, PDF (10 Mo max par fichier).
      </p>

      {state.error && (
        <div className="mt-4 rounded-lg bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[#EF4444]">
          {state.error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <label htmlFor="v-piece" className="mb-2 block text-sm font-medium text-public-text">
            Pi&egrave;ce d&apos;identit&eacute; (CNI, passeport)
          </label>
          <input
            id="v-piece"
            name="piece_identite"
            type="file"
            required
            accept="image/*,.pdf"
            onChange={handlePieceChange}
            className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#2A2A2A] file:px-4 file:py-2 file:text-sm file:font-medium file:text-public-text hover:file:bg-[#3A3A3A]"
          />
          {previewPiece && (
            <div className="mt-3 overflow-hidden rounded-lg border border-public-border">
              {pieceFile?.type === "application/pdf" ? (
                <div className="flex items-center gap-2 bg-public-bg-elevated p-3 text-sm text-public-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>{pieceFile.name}</span>
                </div>
              ) : (
                <>
                  {/* Aperçu local (blob URL) : next/image ne peut pas optimiser ces URLs */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewPiece} alt="Aperçu pièce d'identité" className="max-h-48 w-full object-contain" />
                </>
              )}
            </div>
          )}
        </Card>

        <Card>
          <label htmlFor="v-permis" className="mb-2 block text-sm font-medium text-public-text">
            Permis de conduire
          </label>
          <input
            id="v-permis"
            name="permis_conduire"
            type="file"
            required
            accept="image/*,.pdf"
            onChange={handlePermisChange}
            className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#2A2A2A] file:px-4 file:py-2 file:text-sm file:font-medium file:text-public-text hover:file:bg-[#3A3A3A]"
          />
          {previewPermis && (
            <div className="mt-3 overflow-hidden rounded-lg border border-public-border">
              {permisFile?.type === "application/pdf" ? (
                <div className="flex items-center gap-2 bg-public-bg-elevated p-3 text-sm text-public-text-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>{permisFile.name}</span>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewPermis} alt="Aperçu permis de conduire" className="max-h-48 w-full object-contain" />
                </>
              )}
            </div>
          )}
        </Card>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isPending || !pieceFile || !permisFile}
            className="rounded-xl bg-accent-gold px-6 py-2.5 text-sm font-semibold text-[#0A0A0A] shadow-sm transition-all hover:bg-accent-gold-hover disabled:opacity-50"
          >
            {isPending ? "Compression en cours..." : "Envoyer mes documents"}
          </button>
          <a
            href="/compte/profil"
            className="flex items-center rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm text-public-text-muted transition-colors hover:bg-[#1A1A1A]"
          >
            Annuler
          </a>
        </div>
      </form>
    </div>
  )
}
