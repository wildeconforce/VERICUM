import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
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

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const admin = createAdminClient();
  let query = admin
    .from("contents")
    .select("id, title, status, verification_status, content_type, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: contents } = await query;

  // Enrich with seller emails
  const items = await Promise.all(
    (contents || []).map(async (c: any) => {
      const { data: p } = await admin
        .from("profiles")
        .select("email")
        .eq("id", c.user_id)
        .single();
      return { ...c, seller_email: p?.email || "Unknown" };
    })
  );

  return NextResponse.json({ items });
}
