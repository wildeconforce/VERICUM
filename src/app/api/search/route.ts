import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { attachPreviewUrls } from "@/lib/supabase/preview";
import { CONTENT_TYPES, CATEGORIES, MAX_ITEMS_PER_PAGE } from "@/lib/constants";

function safeInt(val: string | null, fallback: number, min: number, max: number): number {
  const parsed = parseInt(val || String(fallback));
  if (isNaN(parsed) || !isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const verifiedOnly = searchParams.get("verified_only") !== "false";
  const page = safeInt(searchParams.get("page"), 1, 1, 1000);
  const limit = safeInt(searchParams.get("limit"), 20, 1, MAX_ITEMS_PER_PAGE);

  if (!q || q.length === 0 || q.length > 200) {
    return NextResponse.json({ error: "Valid search query required (max 200 chars)" }, { status: 400 });
  }

  // Validate enum filters
  if (type && !(CONTENT_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid type filter" }, { status: 400 });
  }
  if (category && !(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
  }

  // Sanitize: strip SQL/ILIKE special characters (preserve hyphens and underscores for search terms)
  const sanitizedQ = q.replace(/[%\\'";\/\*]/g, "").trim();
  if (sanitizedQ.length === 0) {
    return NextResponse.json({ results: [], total: 0, suggestions: [] });
  }

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

  // RPC returns paginated results — run a separate count query for total
  let total = data?.length || 0;
  if (total === limit) {
    // Might have more results; get exact count via fallback
    const { count } = await supabase
      .from("contents")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`title.ilike.%${sanitizedQ}%,description.ilike.%${sanitizedQ}%`);
    if (count !== null) total = count;
  }

  return NextResponse.json({
    results: data || [],
    total,
    suggestions: [],
  });
}
