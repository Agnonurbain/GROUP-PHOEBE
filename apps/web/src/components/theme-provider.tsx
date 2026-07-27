"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * Thème clair/sombre des espaces qui en proposent un : back-office et pages
 * d'authentification.
 *
 * Le site public reste verrouillé en sombre éditorial (voir design.md) et le
 * layout racine impose `colorScheme: "light"` sur <html>. Ce provider n'est donc
 * monté que dans les layouts concernés ; chacun délimite sa zone par un attribut
 * (`data-admin`, `data-auth`) auquel l'inversion des jetons est rattachée.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      // `light` doit poser une classe : le site public est sombre par défaut,
      // donc « aucune classe » ne peut pas signifier « clair ».
      value={{ light: "light", dark: "dark" }}
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
