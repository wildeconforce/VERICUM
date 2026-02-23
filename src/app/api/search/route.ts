import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachPreviewUrls } from "@/lib/supabase/preview";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const verifiedOnly = searchParams.get("verified_only") !== "false";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!q || q.length > 200) {
    return NextResponse.json({ error: "Valid search query required (max 200 chars)" }, { status: 400 });
  }

  // Sanitize: strip characters that could be problematic
  const sanitizedQ = q.replace(/[%_\\]/g, "");

  const supabase = await createClient();

  const { data, error } = await (supabase.rpc as Function)("search_contents", {
    search_query: sanitizedQ,
    content_type_filter: type || null,
    category_filter: category || null,
    verified_only: verifiedOnly,
    page_num: page,
    page_size: limit,
  });

  if (error) {
    // Fallback to simple search if RPC fails
    let query = supabase
      .from("contents")
      .select("*, profiles!contents_seller_id_fkey(id, username, display_name, avatar_url)", { count: "exact" })
      .eq("status", "active")
      .ilike("title", `%${sanitizedQ}%`);

    if (verifiedOnly) query = query.eq("verification_status", "verified");
    if (type) query = query.eq("content_type", type);
    if (category) query = query.eq("category", category);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order("created_at", { ascending: false });

    const { data: fallbackData, count } = await query;

    await attachPreviewUrls(supabase, fallbackData || []);

    return NextResponse.json({
      results: fallbackData || [],
      total: count || 0,
      suggestions: [],
    });
  }

  return NextResponse.json({
    results: data || [],
    total: data?.length || 0,
    suggestions: [],
  });
}
