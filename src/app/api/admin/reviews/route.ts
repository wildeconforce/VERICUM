import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

/** GET: List content pending manual review */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: verifications } = await admin
    .from("verifications")
    .select("id, content_id, overall_score, vtl_score, vtl_tier, vtl_flags, has_c2pa, ai_score, ai_detector, c2pa_issuer, created_at")
    .eq("status", "manual_review")
    .order("created_at", { ascending: true });

  if (!verifications || verifications.length === 0) {
    return NextResponse.json({ reviews: [] });
  }

  // Enrich with content info
  const reviews = await Promise.all(
    verifications.map(async (v: any) => {
      const { data: content } = await admin
        .from("contents")
        .select("title, user_id")
        .eq("id", v.content_id)
        .single();

      let sellerEmail = "Unknown";
      if (content?.user_id) {
        const { data: profile } = await admin
          .from("profiles")
          .select("email")
          .eq("id", content.user_id)
          .single();
        sellerEmail = profile?.email || "Unknown";
      }

      return {
        ...v,
        content_title: content?.title || "Untitled",
        seller_email: sellerEmail,
        vtl_flags: v.vtl_flags || [],
      };
    })
  );

  return NextResponse.json({ reviews });
}

/** POST: Approve or reject a manual review item */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { verification_id, content_id, action, reason } = await request.json();

  if (!verification_id || !content_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "reject" && !reason?.trim()) {
    return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const newStatus = action === "approve" ? "verified" : "rejected";

  // Update verification
  await admin
    .from("verifications")
    .update({
      status: newStatus,
      reviewed_by: user.id,
      rejection_reason: action === "reject" ? reason : null,
    })
    .eq("id", verification_id);

  // Update content
  await admin
    .from("contents")
    .update({
      verification_status: newStatus,
      status: action === "approve" ? "active" : "draft",
    })
    .eq("id", content_id);

  // Send email notification to seller
  try {
    const { data: content } = await admin
      .from("contents")
      .select("title, user_id")
      .eq("id", content_id)
      .single();

    if (content?.user_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("id", content.user_id)
        .single();

      if (profile?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vericum.com";
        await fetch(`${baseUrl}/api/email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_EMAIL_SECRET || "",
          },
          body: JSON.stringify({
            type: "verification_complete",
            to: profile.email,
            data: {
              contentTitle: content.title || "Your content",
              status: newStatus,
              score: "N/A (Manual Review)",
              contentUrl: `${baseUrl}/content/${content_id}`,
            },
          }),
        });
      }
    }
  } catch (err) {
    // Email failure should not block the review action
    console.error("Failed to send review notification:", err);
  }

  return NextResponse.json({ success: true, status: newStatus });
}
