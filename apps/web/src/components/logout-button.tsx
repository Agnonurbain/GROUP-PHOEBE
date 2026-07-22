"use client"

import { useFormStatus } from "react-dom"
import { deconnexion } from "@/app/actions/auth"

function SubmitButton({ className, label }: { className?: string; label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "..." : label}
    </button>
  )
}

export function LogoutButton({ className, label = "Déconnexion" }: { className?: string; label?: string }) {
  return (
    <form action={deconnexion}>
      <SubmitButton className={className} label={label} />
    </form>
  )
}