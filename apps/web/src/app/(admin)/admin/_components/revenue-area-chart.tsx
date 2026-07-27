"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/shadcn/chart"
import type { PointSerie } from "../_lib/series"

const config = {
  valeur: { label: "Chiffre d'affaires", color: "var(--chart-1)" },
} satisfies ChartConfig

/** Abrège les grands montants : « 1 250 000 FCFA » sature l'axe. */
function abregerFcfa(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")} M`
  if (v >= 1_000) return `${Math.round(v / 1_000)} k`
  return String(v)
}

export function RevenueAreaChart({
  data,
  total,
  periodeLabel,
}: {
  data: PointSerie[]
  total: number
  periodeLabel: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chiffre d&apos;affaires</CardTitle>
        <CardDescription>
          {total.toLocaleString("fr-FR")} FCFA sur {periodeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="remplissageCa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-valeur)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-valeur)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={abregerFcfa}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString("fr-FR")} FCFA`}
                />
              }
            />
            <Area
              dataKey="valeur"
              type="monotone"
              stroke="var(--color-valeur)"
              strokeWidth={2}
              fill="url(#remplissageCa)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
