import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  // Get completed purchases for this seller
  const { data: purchases } = await supabase
    .from("purchases")
    .select("seller_amount, created_at, content_id, contents(title, thumbnail_url)")
    .eq("seller_id", user.id)
    .eq("payment_status", "completed")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  const totalEarnings = (purchases || []).reduce(
    (sum: number, p: any) => sum + (p.seller_amount || 0),
    0
  );
  const salesCount = (purchases || []).length;

  // Get pending payouts
  const { data: pendingPayouts } = await supabase
    .from("payouts")
    .select("amount")
    .eq("seller_id", user.id)
    .eq("status", "pending");

  const pendingPayout = (pendingPayouts || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  );

  // Get last completed payout
  const { data: lastPayoutData } = await supabase
    .from("payouts")
    .select("amount")
    .eq("seller_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  const lastPayout = lastPayoutData?.[0]?.amount || 0;

  // Build chart data - group by day
  const chartDataMap = new Map<string, number>();
  (purchases || []).forEach((p: any) => {
    const date = new Date(p.created_at).toISOString().split("T")[0];
    chartDataMap.set(date, (chartDataMap.get(date) || 0) + (p.seller_amount || 0));
  });

  const chartData = Array.from(chartDataMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Content-level sales stats
  const contentStatsMap = new Map<string, any>();
  (purchases || []).forEach((p: any) => {
    const existing = contentStatsMap.get(p.content_id) || {
      content_id: p.content_id,
      title: (p.contents as any)?.title || "Unknown",
      thumbnail_url: (p.contents as any)?.thumbnail_url || null,
      total_sales: 0,
      total_revenue: 0,
    };
    existing.total_sales += 1;
    existing.total_revenue += p.seller_amount || 0;
    contentStatsMap.set(p.content_id, existing);
  });

  const contentStats = Array.from(contentStatsMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue);

  return NextResponse.json({
    total_earnings: totalEarnings,
    pending_payout: pendingPayout,
    last_payout: lastPayout,
    sales_count: salesCount,
    chart_data: chartData,
    content_stats: contentStats,
  });
}
