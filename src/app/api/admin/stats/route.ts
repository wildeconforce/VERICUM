import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const [
    { count: totalContent },
    { count: verified },
    { count: rejected },
    { count: pendingReview },
    { count: totalUsers },
    { count: totalSellers },
    { data: recentVerifications },
  ] = await Promise.all([
    admin.from("contents").select("*", { count: "exact", head: true }),
    admin.from("verifications").select("*", { count: "exact", head: true }).eq("status", "verified"),
    admin.from("verifications").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("verifications").select("*", { count: "exact", head: true }).eq("status", "manual_review"),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).neq("role", "user"),
    admin
      .from("verifications")
      .select("id, content_id, status, vtl_tier, overall_score, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Fetch content titles for recent verifications
  const enriched = await Promise.all(
    (recentVerifications || []).map(async (v: any) => {
      const { data: content } = await admin
        .from("contents")
        .select("title")
        .eq("id", v.content_id)
        .single();
      return { ...v, content_title: content?.title || "Untitled" };
    })
  );

  return NextResponse.json({
    totalContent: totalContent || 0,
    verified: verified || 0,
    rejected: rejected || 0,
    pendingReview: pendingReview || 0,
    totalUsers: totalUsers || 0,
    totalSellers: totalSellers || 0,
    recentVerifications: enriched,
  });
}
