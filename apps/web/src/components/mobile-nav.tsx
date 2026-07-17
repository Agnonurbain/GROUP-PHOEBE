"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav({
  links,
  authAction,
}: {
  links: { href: string; label: string }[];
  authAction?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute left-0 right-0 top-16 z-50 border-b border-phoebe-pearl bg-white/98 px-4 py-3 shadow-lg backdrop-blur-sm">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-phoebe-anthracite/70 transition-colors hover:bg-phoebe-pearl hover:text-phoebe-green"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {authAction && (
            <div className="mt-2 border-t border-phoebe-pearl pt-2">
              {authAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
