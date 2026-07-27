"use client"

import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/shadcn/badge"
import { Button } from "@/components/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu"

export type LigneDemande = {
  id: string
  created_at: string
  statut: string
  montant: number | null
  client: string
  vehicule: string
}

// Aligné sur la contrainte CHECK de demandes_transport (migration 00001).
const STATUTS: Record<string, { label: string; classe: string }> = {
  en_attente_paiement: { label: "Attente paiement", classe: "bg-blue-500/10 text-blue-600" },
  en_attente_validation: { label: "En attente", classe: "bg-phoebe-gold/15 text-phoebe-gold-dark" },
  acceptee: { label: "Acceptée", classe: "bg-phoebe-green/15 text-phoebe-green-deep" },
  terminee: { label: "Terminée", classe: "bg-phoebe-green/15 text-phoebe-green-deep" },
  refusee: { label: "Refusée", classe: "bg-error/10 text-error" },
  annulee: { label: "Annulée", classe: "bg-muted text-muted-foreground" },
}

export const colonnesDemandes: ColumnDef<LigneDemande, unknown>[] = [
  {
    accessorKey: "client",
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
    cell: ({ row }) => <span className="font-medium">{row.original.client}</span>,
  },
  {
    accessorKey: "vehicule",
    header: "Véhicule",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.vehicule}</span>
    ),
  },
  {
    accessorKey: "statut",
    header: "Statut",
    cell: ({ row }) => {
      const s = STATUTS[row.original.statut] ?? {
        label: row.original.statut,
        classe: "bg-muted text-muted-foreground",
      }
      return (
        <Badge variant="secondary" className={s.classe}>
          {s.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "montant",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Montant
        <ArrowUpDown className="size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const m = row.original.montant
      return (
        <span className="tabular-nums">
          {m == null ? "—" : `${Number(m).toLocaleString("fr-FR")} FCFA`}
        </span>
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
        Date
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
            <DropdownMenuItem render={<Link href="/admin/demandes" />} nativeButton={false}>
              Ouvrir dans les demandes
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
