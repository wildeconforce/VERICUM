"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Clock, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface EarningsData {
  total_earnings: number;
  pending_payout: number;
  last_payout: number;
  sales_count: number;
  chart_data: { date: string; amount: number }[];
  content_stats: {
    content_id: string;
    title: string;
    thumbnail_url: string | null;
    total_sales: number;
    total_revenue: number;
  }[];
}

export default function EarningsPage() {
  const t = useTranslations();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [period, setPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      setIsLoading(true);
      const res = await fetch(`/api/user/earnings?period=${period}`);
      if (res.ok) {
        setEarnings(await res.json());
      }
      setIsLoading(false);
    }
    fetchEarnings();
  }, [period]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t("earnings.title")}</h1>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="week">{t("earnings.week")}</TabsTrigger>
            <TabsTrigger value="month">{t("earnings.month")}</TabsTrigger>
            <TabsTrigger value="year">{t("earnings.year")}</TabsTrigger>
            <TabsTrigger value="all">{t("earnings.allTime")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: t("earnings.totalEarnings"), value: earnings?.total_earnings, icon: DollarSign },
          { title: t("earnings.totalSales"), value: earnings?.sales_count, icon: TrendingUp, isCurrency: false },
          { title: t("earnings.pendingPayout"), value: earnings?.pending_payout, icon: Clock },
          { title: t("earnings.lastPayout"), value: earnings?.last_payout, icon: CreditCard },
        ].map(({ title, value, icon: Icon, isCurrency = true }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {isCurrency ? formatPrice(value || 0) : (value || 0)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("earnings.revenueOverTime")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : earnings?.chart_data && earnings.chart_data.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earnings.chart_data}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                            <p className="text-sm font-bold">{formatPrice(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    fill="url(#colorAmount)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              {t("earnings.noData")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Sales Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{t("seller.dashboard.revenueByContent")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : earnings?.content_stats && earnings.content_stats.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earnings.content_stats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="title"
                      className="text-xs"
                      tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + "..." : v}
                    />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-md">
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.total_sales} sales</p>
                              <p className="text-sm font-bold">{formatPrice(item.total_revenue)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {earnings.content_stats.map((stat) => (
                  <div key={stat.content_id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium truncate">{stat.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      <span>{stat.total_sales} sales</span>
                      <span className="font-medium text-foreground">{formatPrice(stat.total_revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No sales data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
