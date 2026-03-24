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

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Get content counts
  const users = await Promise.all(
    (profiles || []).map(async (p: any) => {
      const { count } = await admin
        .from("contents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", p.id);
      return { ...p, content_count: count || 0 };
    })
  );

  return NextResponse.json({ users });
}
