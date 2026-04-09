import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachPreviewUrls } from "@/lib/supabase/preview";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*, contents(id, title, thumbnail_url, preview_url, original_url, price, currency, verification_status, profiles!contents_seller_id_fkey(display_name, username))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Generate signed preview URLs for bookmark contents missing thumbnails
  const items = (bookmarks || []).map((b: any) => b.contents).filter(Boolean);
  await attachPreviewUrls(supabase, items);

  return NextResponse.json({ bookmarks: bookmarks || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content_id } = await request.json();

  const { data: result } = await supabase.rpc("toggle_bookmark", {
    p_user_id: user.id,
    p_content_id: content_id,
  });

  return NextResponse.json({ bookmarked: result });
}
