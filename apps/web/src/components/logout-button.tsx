"use client"

import { useRef, useState } from "react"
import { deconnexion } from "@/app/actions/auth"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useT } from "@/lib/langue-context"

export function LogoutButton({ className, label = "Déconnexion" }: { className?: string; label?: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>

      {/* Le formulaire déclenche le server action ; le bouton visible ne fait
          qu'ouvrir la confirmation. */}
      <form ref={formRef} action={deconnexion} className="hidden" />

      <ConfirmDialog
        open={open}
        title={t.divers.seDeconnecterConfirmation}
        message="Vous devrez vous reconnecter pour accéder à votre compte."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        danger
        busy={busy}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setBusy(true)
          formRef.current?.requestSubmit()
        }}
      />
    </>
  )
}
