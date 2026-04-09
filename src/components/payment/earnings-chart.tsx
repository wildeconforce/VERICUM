"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";

interface EarningsChartProps {
  data: { date: string; amount: number }[];
}

export function EarningsChart({ data }: EarningsChartProps) {
  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No earnings data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end gap-1">
          {data.map((point, i) => {
            const height = (point.amount / maxAmount) * 100;
            return (
              <div
                key={i}
                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow whitespace-nowrap z-10">
                  {formatPrice(point.amount)}
                  <br />
                  <span className="text-muted-foreground">{point.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
