"use client"

import { useState } from "react"
import Link from "next/link"

type MobileLink = { href: string; label: string; isButton?: boolean }

export function PublicMobileNav({
  links,
  authAction,
}: {
  links: MobileLink[]
  authAction?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[#8A8A8A] transition-colors hover:bg-[#1A1A1A]"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
          <div className="fixed left-0 right-0 top-16 z-50 border-b border-[#2A2A2A] bg-[#0A0A0A] px-5 py-4 shadow-xl backdrop-blur-md">
            <nav className="flex flex-col gap-0.5">
              {links.map((link) =>
                link.isButton ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="mt-2 block rounded-lg bg-[#C9A84C] px-4 py-3 text-center text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#B8943A]"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-[#8A8A8A] transition-all hover:bg-[#1A1A1A] hover:text-[#F5F5F5]"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
            {authAction && (
              <div className="mt-3 border-t border-[#2A2A2A] pt-3">{authAction}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
