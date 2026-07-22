"use client"

import { usePathname } from "next/navigation"

function getVertical(pathname: string): string {
  if (pathname === "/") return "accueil"
  const segment = pathname.split("/").filter(Boolean)[0]
  const verticals = ["transport", "immobilier", "livraison", "assistance", "contact", "compte", "panier", "reservation", "offline"]
  return verticals.includes(segment) ? segment : "accueil"
}

export function VerticalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-public-bg text-public-text font-sans" data-vertical={getVertical(pathname)}>
      {children}
    </div>
  )
}
