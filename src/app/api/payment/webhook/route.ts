import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/payment/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLicenseKey } from "@/lib/utils/format";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const contentId = session.metadata?.content_id;
    const commissionAmount = parseFloat(session.metadata?.commission_amount || "0");

    if (!contentId) {
      return NextResponse.json({ error: "Missing content_id" }, { status: 400 });
    }

    // Get content info
    const { data: content } = await adminClient
      .from("contents")
      .select("seller_id, price, currency, license_type")
      .eq("id", contentId)
      .single();

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const totalAmount = session.amount_total / 100;
    const sellerAmount = totalAmount - commissionAmount;

    // Create purchase record
    await adminClient.from("purchases").insert({
      buyer_id: session.client_reference_id || session.customer_email,
      content_id: contentId,
      seller_id: content.seller_id,
      amount: totalAmount,
      currency: content.currency,
      commission_amount: commissionAmount,
      seller_amount: sellerAmount,
      license_type: content.license_type,
      license_key: generateLicenseKey(),
      payment_provider: "stripe",
      payment_id: session.payment_intent,
      payment_status: "completed",
    });

    // Update download count
    await adminClient
      .from("contents")
      .update({ download_count: 1 })
      .eq("id", contentId);
  }

  return NextResponse.json({ received: true });
}
