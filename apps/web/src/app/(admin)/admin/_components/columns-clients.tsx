"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/admin-ui/badge"
import { Button } from "@/components/admin-ui/button"
import { Avatar, AvatarFallback } from "@/components/admin-ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu"

export type LigneClient = {
  id: string
  created_at: string
  nom: string
  telephone: string | null
  statut_verification: string
}

// Aligné sur la contrainte CHECK de users.statut_verification (migration 00001).
const VERIFICATION: Record<string, { label: string; classe: string }> = {
  verifie: { label: "Vérifié", classe: "bg-phoebe-green/15 text-phoebe-green-deep" },
  documents_soumis: { label: "À vérifier", classe: "bg-phoebe-gold/15 text-phoebe-gold-dark" },
  non_verifie: { label: "Non vérifié", classe: "bg-muted text-muted-foreground" },
  rejete: { label: "Rejeté", classe: "bg-error/10 text-error" },
}

export const colonnesClients: ColumnDef<LigneClient, unknown>[] = [
  {
    accessorKey: "nom",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Client
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="size-7">
          <AvatarFallback className="bg-phoebe-pearl text-[11px] font-semibold text-phoebe-anthracite">
            {(row.original.nom || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.nom}</span>
      </div>
    ),
  },
  {
    accessorKey: "telephone",
    header: "Téléphone",
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.telephone ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "statut_verification",
    header: "Vérification",
    cell: ({ row }) => {
      const v = VERIFICATION[row.original.statut_verification] ?? {
        label: row.original.statut_verification,
        classe: "bg-muted text-muted-foreground",
      }
      return (
        <Badge variant="secondary" className={v.classe}>
          {v.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Inscription
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {new Date(row.original.created_at).toLocaleDateString("fr-FR")}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/admin/verifications" />} nativeButton={false}>
              Ouvrir les vérifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void navigator.clipboard.writeText(row.original.id)}
            >
              Copier l&apos;identifiant
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]
