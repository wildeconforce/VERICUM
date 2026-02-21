import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const period = request.nextUrl.searchParams.get("period") || "month";
  // Get total earnings
  const { data: purchases } = await supabase
    .from("purchases")
    .select("seller_amount, created_at")
    .eq("seller_id", user.id)
    .eq("payment_status", "completed");
  const totalEarnings = purchases?.reduce((sum: number, p: any) => sum + Number(p.seller_amount), 0) || 0;
  const salesCount = purchases?.length || 0;
  // Get pending payouts
  const { data: pendingPayouts } = await supabase
    .from("payouts")
    .select("amount")
    .eq("seller_id", user.id)
    .eq("status", "pending");
  const pendingPayout = pendingPayouts?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  // Get last payout
  const { data: lastPayoutData } = await supabase
    .from("payouts")
    .select("amount")
    .eq("seller_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);
  const lastPayout = lastPayoutData?.[0]?.amount || 0;
  // Build chart data based on period
  const now = new Date();
  const chartData: { date: string; amount: number }[] = [];
  const daysBack = period === "week" ? 7 : period === "month" ? 30 : period === "year" ? 365 : 30;
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayEarnings = purchases
      ?.filter((p: any) => p.created_at.startsWith(dateStr))
      .reduce((sum: number, p: any) => sum + Number(p.seller_amount), 0) || 0;
    chartData.push({ date: dateStr, amount: dayEarnings });
  }
  return NextResponse.json({
    total_earnings: totalEarnings,
    pending_payout: pendingPayout,
    last_payout: Number(lastPayout),
    sales_count: salesCount,
    chart_data: chartData,
  });
}