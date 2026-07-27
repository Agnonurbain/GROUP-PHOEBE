"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon, LogOut, ChevronsUpDown } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/admin-ui/breadcrumb"
import { Button } from "@/components/admin-ui/button"
import { Separator } from "@/components/admin-ui/separator"
import { SidebarTrigger } from "@/components/admin-ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/admin-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu"
import { deconnexion } from "@/app/actions/auth"
import { buildBreadcrumb } from "../_lib/nav"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // Les deux icônes sont rendues et c'est le CSS qui choisit : pas d'état de
  // montage, donc aucune divergence serveur/client à gérer.
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Changer de thème"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}

export function AdminHeader({
  nom,
  email,
  role,
  notifications,
}: {
  nom: string
  email: string | null
  role: string
  notifications: React.ReactNode
}) {
  const pathname = usePathname()
  const fil = buildBreadcrumb(pathname)
  const initiale = (nom || "U").charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          {fil.map((segment) => (
            <BreadcrumbItem key={segment.href}>
              {segment.last ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink render={<Link href={segment.href} />}>
                    {segment.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        {notifications}
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Menu du profil" />
            }
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-phoebe-green text-xs font-semibold text-white">
                {initiale}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline-block">{nom}</span>
            <ChevronsUpDown className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="block text-sm font-medium">{nom}</span>
              {email && (
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              )}
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-phoebe-gold-dark">
                {role === "proprietaire" ? "Propriétaire" : "Opérateur"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/" />}
            >
              Voir le site
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void deconnexion()
              }}
            >
              <LogOut className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
