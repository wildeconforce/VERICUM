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

    // Validate buyer_id - must be a valid UUID from client_reference_id
    const buyerId = session.client_reference_id;
    if (!buyerId) {
      console.error("Webhook: missing client_reference_id for session", session.id);
      return NextResponse.json({ error: "Missing buyer reference" }, { status: 400 });
    }

    const totalAmount = session.amount_total / 100;
    const sellerAmount = totalAmount - commissionAmount;

    // Prevent duplicate purchases for the same payment
    const { data: existingPurchase } = await adminClient
      .from("purchases")
      .select("id")
      .eq("payment_id", session.payment_intent)
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json({ received: true, note: "already processed" });
    }

    // Create purchase record
    await adminClient.from("purchases").insert({
      buyer_id: buyerId,
      content_id: contentId,
      seller_id: content.seller_id,
      amount: totalAmount,
      currency: content.currency,
      commission_amount: commissionAmount,
      seller_amount: sellerAmount,
      license_type: session.metadata?.license_type || content.license_type,
      license_key: generateLicenseKey(),
      payment_provider: "stripe",
      payment_id: session.payment_intent,
      payment_status: "completed",
    });

    // Update seller earnings and sales count
    await adminClient.rpc("increment_seller_earnings" as any, {
      seller_uuid: content.seller_id,
      earning_amount: sellerAmount,
    });

    // Increment content view/purchase count
    await adminClient.rpc("increment_view_count", { content_uuid: contentId });
  }

  return NextResponse.json({ received: true });
}
