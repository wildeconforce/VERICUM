import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE, CONTENT_TYPES, CATEGORIES } from "@/lib/constants";
import { slugify } from "@/lib/utils/format";
import { attachPreviewUrls } from "@/lib/supabase/preview";

function safeInt(val: string | null, fallback: number, min: number, max: number): number {
  const parsed = parseInt(val || String(fallback));
  if (isNaN(parsed) || !isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function safePrice(val: string | null): number | null {
  if (!val) return null;
  const parsed = parseFloat(val);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = safeInt(searchParams.get("page"), 1, 1, 1000);
  const limit = safeInt(searchParams.get("limit"), ITEMS_PER_PAGE, 1, MAX_ITEMS_PER_PAGE);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const minPrice = safePrice(searchParams.get("min_price"));
  const maxPrice = safePrice(searchParams.get("max_price"));
  const sort = searchParams.get("sort") || "newest";
  const verifiedOnly = searchParams.get("verified_only") !== "false";

  // Validate enum filters
  if (type && !(CONTENT_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid type filter" }, { status: 400 });
  }
  if (category && !(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
  }

  const VALID_SORTS = ["newest", "popular", "price_asc", "price_desc"];
  const validSort = VALID_SORTS.includes(sort) ? sort : "newest";

  const supabase = await createClient();
  let query = supabase
    .from("contents")
    .select("*", { count: "exact" })
    .eq("status", "active");

  if (verifiedOnly) query = query.eq("verification_status", "verified");
  if (category) query = query.eq("category", category);
  if (type) query = query.eq("content_type", type);
  if (minPrice !== null) query = query.gte("price", minPrice);
  if (maxPrice !== null) query = query.lte("price", maxPrice);

  switch (validSort) {
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Content list error:", error);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }

  // Generate signed preview URLs for items without thumbnails
  const contentsWithPreviews = await attachPreviewUrls(supabase, data || []);

  return NextResponse.json({
    data: contentsWithPreviews,
    total: count || 0,
    page,
    total_pages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "user") {
    return NextResponse.json({ error: "Seller account required" }, { status: 403 });
  }

  const body = await request.json();

  // Input validation
  if (!body.title || typeof body.title !== "string" || body.title.trim().length < 2) {
    return NextResponse.json({ error: "Title is required (min 2 characters)" }, { status: 400 });
  }
  if (typeof body.price !== "number" || !isFinite(body.price) || body.price < 0.50 || body.price > 50000) {
    return NextResponse.json({ error: "Price must be between $0.50 and $50,000" }, { status: 400 });
  }
  // Round price to 2 decimal places
  const price = Math.round(body.price * 100) / 100;

  if (!body.file_key || typeof body.file_key !== "string") {
    return NextResponse.json({ error: "file_key is required" }, { status: 400 });
  }
  if (!(CONTENT_TYPES as readonly string[]).includes(body.content_type)) {
    return NextResponse.json({ error: "Invalid content_type" }, { status: 400 });
  }
  if (body.category && !(CATEGORIES as readonly string[]).includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const slug = slugify(body.title) + "-" + Date.now().toString(36);

  const { data, error } = await supabase
    .from("contents")
    .insert({
      seller_id: user.id,
      title: body.title,
      description: body.description,
      slug,
      content_type: body.content_type,
      original_url: body.file_key,
      price,
      currency: body.currency || "USD",
      license_type: body.license_type || "standard",
      tags: body.tags || [],
      category: body.category,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Content creation error:", error);
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 });
  }

  // Fire and forget view count
  void (supabase.rpc as Function)("increment_view_count", { content_uuid: data.id });

  return NextResponse.json({ content: data }, { status: 201 });
}
