"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/shadcn/sidebar"
import { NAV_GROUPS, isActive, type BadgeKey } from "../_lib/nav"

export type NavCounts = Record<BadgeKey, number | null>

export function AdminSidebar({
  isProprietaire,
  isAgent,
  counts,
}: {
  isProprietaire: boolean
  isAgent: boolean
  counts: NavCounts
}) {
  const pathname = usePathname()

  const roleLabel = isProprietaire ? "Propriétaire" : isAgent ? "Agent Immo" : "Opérateur"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* Le logo disparaît en mode réduit : la marque n'a pas de place utile. */}
        <Link href="/admin" className="flex items-center gap-2 px-1 py-1.5">
          <Image
            src="/logo.webp"
            alt="Group PHOEBE"
            width={200}
            height={80}
            quality={85}
            className="h-9 w-auto object-contain group-data-[collapsible=icon]:hidden"
          />
          <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-phoebe-green text-xs font-bold text-white group-data-[collapsible=icon]:flex">
            GP
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-phoebe-gold-dark group-data-[collapsible=icon]:hidden">
            {roleLabel}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.filter((g) => {
          if (isAgent) return g.title === "Immobilier"
          return !g.proprietaireOnly || isProprietaire
        }).map((group, i) => {
          const items = group.items.filter((it) => {
            return !it.proprietaireOnly || isProprietaire
          })
          if (items.length === 0) return null

          return (
            <SidebarGroup key={group.title ?? `groupe-${i}`}>
              {group.title && <SidebarGroupLabel>{group.title}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const actif = isActive(pathname, item)
                    const compteur = item.badge ? counts[item.badge] : null

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={actif}
                          tooltip={item.label}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {compteur ? (
                          <SidebarMenuBadge
                            className={
                              item.badgeUrgent
                                ? "bg-error text-white"
                                : "bg-phoebe-green/15 text-phoebe-green-deep"
                            }
                          >
                            {compteur}
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <p className="px-2 py-1 text-[9px] font-medium tracking-[0.12em] text-muted-foreground group-data-[collapsible=icon]:hidden">
          GROUP PHOEBE &copy; {new Date().getFullYear()}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
