"use client"

import { usePathname } from "next/navigation"
import { attributVerticale } from "@/lib/verticales"

/**
 * `data-vertical` porte la couleur d'accent du service (voir `globals.css`).
 *
 * La correspondance chemin → service vit dans `lib/verticales.ts`, partagée
 * avec l'en-tête. Les deux la décidaient chacun de leur côté et ne disaient pas
 * la même chose : ici `/panier` et `/reservation` étaient traités comme des
 * univers à part entière, alors qu'ils appartiennent au transport.
 */
export function VerticalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div
      className="min-h-screen bg-public-bg text-public-text font-sans"
      data-vertical={attributVerticale(pathname)}
    >
      {children}
    </div>
  )
}
