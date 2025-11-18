"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardStats } from "@/features/dashboard/types"

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface SectionCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export function SectionCards({ stats, loading }: SectionCardsProps) {
  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription className="h-4 w-24 animate-pulse bg-muted rounded" />
              <CardTitle className="h-8 w-32 animate-pulse bg-muted rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      description: "Total Revenue",
      value: currencyFormatter.format(stats.totalRevenue.value),
      trend: stats.totalRevenue.trend,
      trendDirection: stats.totalRevenue.trendDirection,
      footerText: stats.totalRevenue.footerText,
      footerSubtext: stats.totalRevenue.footerSubtext,
    },
    {
      description: "Total Sales",
      value: numberFormatter.format(stats.totalSales.value),
      trend: stats.totalSales.trend,
      trendDirection: stats.totalSales.trendDirection,
      footerText: stats.totalSales.footerText,
      footerSubtext: stats.totalSales.footerSubtext,
    },
    {
      description: "Total Purchases",
      value: numberFormatter.format(stats.totalPurchases.value),
      trend: stats.totalPurchases.trend,
      trendDirection: stats.totalPurchases.trendDirection,
      footerText: stats.totalPurchases.footerText,
      footerSubtext: stats.totalPurchases.footerSubtext,
    },
    {
      description: "Low Stock Items",
      value: numberFormatter.format(stats.lowStockItems.value),
      trend: stats.lowStockItems.trend,
      trendDirection: stats.lowStockItems.trendDirection,
      footerText: stats.lowStockItems.footerText,
      footerSubtext: stats.lowStockItems.footerSubtext,
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trendDirection === "up" ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {card.trend >= 0 ? "+" : ""}
                {card.trend.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.footerText}{" "}
              {card.trendDirection === "up" ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
            </div>
            <div className="text-muted-foreground">{card.footerSubtext}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
