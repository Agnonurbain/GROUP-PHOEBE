"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

/**
 * Thème clair/sombre du back-office UNIQUEMENT.
 *
 * Le site public est verrouillé en sombre éditorial (voir design.md) et le
 * layout racine impose `colorScheme: "light"` sur <html>. Ce provider n'est donc
 * monté que dans le layout admin : il pose la classe `dark` sur <html> quand le
 * back-office bascule, sans rien changer pour les pages publiques.
 */
export function AdminThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
