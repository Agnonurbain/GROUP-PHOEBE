"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin-ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/admin-ui/chart"
import type { PointSerie } from "../_lib/series"

const config = {
  valeur: { label: "Demandes", color: "var(--chart-2)" },
} satisfies ChartConfig

export function ActiviteBarChart({
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
        <CardTitle>Activité</CardTitle>
        <CardDescription>
          {total.toLocaleString("fr-FR")} demande{total > 1 ? "s" : ""} sur {periodeLabel}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
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
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="valeur" fill="var(--color-valeur)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
