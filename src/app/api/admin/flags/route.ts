import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Get verifications with non-empty VTL flags
  const { data: verifications } = await admin
    .from("verifications")
    .select("id, content_id, vtl_score, vtl_tier, vtl_flags, status, created_at")
    .not("vtl_flags", "eq", "[]")
    .not("vtl_flags", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  // Filter to items that actually have critical/warning flags
  const flagged = (verifications || []).filter((v: any) => {
    const flags = v.vtl_flags || [];
    return flags.some((f: any) => f.type === "critical" || f.type === "warning");
  });

  // Enrich with content titles
  const items = await Promise.all(
    flagged.map(async (v: any) => {
      const { data: content } = await admin
        .from("contents")
        .select("title")
        .eq("id", v.content_id)
        .single();
      return { ...v, content_title: content?.title || "Untitled" };
    })
  );

  return NextResponse.json({ items });
}
