import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectAccount, createConnectOnboardingLink } from "@/lib/payment/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, role, country")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Seller account required" }, { status: 403 });
  }

  let stripeAccountId = profile.stripe_account_id;

  // Create Stripe Connect account if not exists
  if (!stripeAccountId) {
    const account = await createConnectAccount(user.email!, profile.country || "US");
    stripeAccountId = account.id;

    await supabase
      .from("profiles")
      .update({ stripe_account_id: stripeAccountId } as never)
      .eq("id", user.id);
  }

  // Create onboarding link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const link = await createConnectOnboardingLink(
    stripeAccountId,
    `${appUrl}/settings?stripe=connected`
  );

  return NextResponse.json({ url: link.url });
}
