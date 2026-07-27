"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/shadcn/button"
import { cn } from "@/lib/utils"

/**
 * Bascule clair/sombre, partagée par le back-office et les pages d'auth.
 *
 * Les deux icônes sont rendues et c'est le CSS qui choisit : pas d'état de
 * montage, donc aucune divergence serveur/client à gérer.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Changer de thème"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}
