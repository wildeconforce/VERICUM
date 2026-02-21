import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/payment/stripe";
import { calculateCommission } from "@/lib/payment/commission";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content_id, license_type } = body;

  // Get content and seller info
  const { data: content, error: contentError } = await supabase
    .from("contents")
    .select("*, profiles!contents_seller_id_fkey(stripe_account_id, commission_rate)")
    .eq("id", content_id)
    .eq("status", "active")
    .single();

  if (contentError || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // Check if already purchased
  const { data: existing } = await supabase
    .from("purchases")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("content_id", content_id)
    .eq("payment_status", "completed")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });
  }

  const sellerProfile = content.profiles as any;
  const commission = calculateCommission(
    content.price,
    license_type || content.license_type,
    (sellerProfile?.commission_rate || 20) / 100
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await createCheckoutSession({
    contentId: content_id,
    contentTitle: content.title,
    amount: commission.totalCharge,
    currency: content.currency,
    buyerEmail: user.email!,
    sellerStripeAccountId: sellerProfile?.stripe_account_id || null,
    commissionAmount: commission.commissionAmount,
    successUrl: `${appUrl}/content/${content_id}?purchased=true`,
    cancelUrl: `${appUrl}/content/${content_id}`,
  });

  return NextResponse.json({
    checkout_url: session.url,
    session_id: session.id,
  });
}
