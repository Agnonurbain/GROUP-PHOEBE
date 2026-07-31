import {
  LayoutDashboard,
  ClipboardList,
  Car,
  CalendarPlus,
  ShieldCheck,
  History,
  CalendarDays,
  Undo2,
  Tags,
  MapPinned,
  Truck,
  Building2,
  FileText,
  Plane,
  Ticket,
  Users,
  ScrollText,
  Settings,
  MessageSquare,
  PenLine,
  Receipt,
  type LucideIcon,
} from "lucide-react"

/**
 * Source unique de la navigation du back-office : alimente la sidebar ET le fil
 * d'ariane. Reprend à l'identique les groupes et les gardes de rôle du layout
 * précédent — aucune entrée ajoutée ni retirée.
 */

export type BadgeKey = "demandes" | "remboursements" | "propositions"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Correspondance stricte : sans ça, /admin/verifications resterait actif sur son historique. */
  exact?: boolean
  proprietaireOnly?: boolean
  /**
   * Masqué pour un agent immobilier. La gestion du catalogue lui est fermée par
   * les policies `biens_staff_manage` / `bien_medias_staff_manage` : lui laisser
   * l'entrée le conduisait à un formulaire qui n'enregistrait rien.
   */
  masquePourAgent?: boolean
  badge?: BadgeKey
  /** Un badge rouge signale une action urgente (remboursement à traiter). */
  badgeUrgent?: boolean
}

export type NavGroup = {
  title: string | null
  proprietaireOnly?: boolean
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    proprietaireOnly: true,
    items: [{ href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Transport",
    items: [
      { href: "/admin/demandes", label: "Demandes", icon: ClipboardList, badge: "demandes" },
      { href: "/admin/vehicules", label: "Véhicules", icon: Car },
      { href: "/admin/reserver-pour-client", label: "Réserver pour client", icon: CalendarPlus },
      { href: "/admin/verifications", label: "Vérifications", icon: ShieldCheck, exact: true },
      { href: "/admin/verifications/historique", label: "Historique vérif.", icon: History },
      { href: "/admin/planning", label: "Planning", icon: CalendarDays },
      {
        href: "/admin/remboursements",
        label: "Remboursements",
        icon: Undo2,
        proprietaireOnly: true,
        badge: "remboursements",
        badgeUrgent: true,
      },
      {
        href: "/admin/propositions",
        label: "Propositions de prix",
        icon: Tags,
        proprietaireOnly: true,
        badge: "propositions",
      },
      { href: "/admin/tarifs", label: "Zones & Tarifs", icon: MapPinned, proprietaireOnly: true },
    ],
  },
  {
    title: "Livraison",
    items: [{ href: "/admin/expeditions", label: "Livraisons", icon: Truck }],
  },
  {
    title: "Immobilier",
    items: [
      { href: "/admin/biens", label: "Biens", icon: Building2, masquePourAgent: true },
      { href: "/admin/demandes-immobilier", label: "Demandes immobilier", icon: FileText },
      { href: "/admin/transactions-immobilier", label: "Transactions", icon: ScrollText },
      { href: "/admin/parametres-immobilier", label: "Paramètres", icon: Settings, proprietaireOnly: true },
    ],
  },
  {
    title: "Assistance",
    items: [
      { href: "/admin/dossiers-voyage", label: "Dossiers visa", icon: Plane },
      { href: "/admin/billets", label: "Billets d'avion", icon: Ticket },
    ],
  },
  {
    title: "Modération",
    items: [
      { href: "/admin/avis", label: "Avis clients", icon: MessageSquare },
    ],
  },
  {
    title: "Contenu",
    items: [
      { href: "/admin/blog", label: "Blog / Guides", icon: PenLine },
    ],
  },
  {
    title: "Administration",
    proprietaireOnly: true,
    items: [
      { href: "/admin/comptes", label: "Comptes internes", icon: Users },
      { href: "/admin/factures", label: "Facturation", icon: Receipt },
      { href: "/admin/audit", label: "Journal d'audit", icon: ScrollText },
    ],
  },
]

/** Libellés du fil d'ariane, y compris pour les segments sans entrée de nav. */
const LABELS: Record<string, string> = {
  admin: "Back-office",
  ...Object.fromEntries(
    NAV_GROUPS.flatMap((g) =>
      g.items.map((i) => [i.href.split("/").filter(Boolean).at(-1) ?? "", i.label])
    )
  ),
  historique: "Historique",
  nouveau: "Nouveau",
}

/** Segment → libellé lisible. Un id (uuid, slug) reste tel quel. */
export function segmentLabel(segment: string): string {
  return LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
}

/** Fil d'ariane cumulatif, le dernier élément étant la page courante. */
export function buildBreadcrumb(pathname: string): { href: string; label: string; last: boolean }[] {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((seg, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: segmentLabel(seg),
    last: i === segments.length - 1,
  }))
}

/** Une entrée est active si la route correspond (strictement si `exact`). */
export function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href + "/")
}
