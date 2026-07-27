import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

export function KpiCard({
  label,
  valeur,
  unite,
  icon: Icon,
  evolution,
  aide,
  /** Une hausse n'est pas toujours bonne : annulations, délais… */
  hausseEstBonne = true,
}: {
  label: string
  valeur: string | number
  unite?: string
  icon: LucideIcon
  evolution?: number | null
  aide?: string
  hausseEstBonne?: boolean
}) {
  const aEvolution = evolution !== null && evolution !== undefined && evolution !== 0
  const positif = aEvolution && (evolution > 0) === hausseEstBonne

  return (
    <Card className="gap-0 py-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-foreground">{valeur}</span>
          {unite && <span className="text-sm text-muted-foreground">{unite}</span>}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {aEvolution && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                positif ? "text-phoebe-green-deep" : "text-error"
              )}
            >
              {evolution > 0 ? (
                <TrendingUp className="size-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="size-3" aria-hidden="true" />
              )}
              {evolution > 0 ? "+" : ""}
              {evolution} %
            </span>
          )}
          {aide && <span className="text-muted-foreground">{aide}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
