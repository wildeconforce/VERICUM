import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE } from "@/lib/constants";
import { slugify } from "@/lib/utils/format";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || String(ITEMS_PER_PAGE)), MAX_ITEMS_PER_PAGE);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const sort = searchParams.get("sort") || "newest";
  const verifiedOnly = searchParams.get("verified_only") !== "false";

  const supabase = await createClient();
  let query = supabase
    .from("contents")
    .select("*", { count: "exact" })
    .eq("status", "active");

  if (verifiedOnly) query = query.eq("verification_status", "verified");
  if (category) query = query.eq("category", category);
  if (type) query = query.eq("content_type", type);
  if (minPrice) query = query.gte("price", parseFloat(minPrice));
  if (maxPrice) query = query.lte("price", parseFloat(maxPrice));

  switch (sort) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
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
      price: body.price,
      currency: body.currency || "USD",
      license_type: body.license_type || "standard",
      tags: body.tags || [],
      category: body.category,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire and forget view count
  void (supabase.rpc as Function)("increment_view_count", { content_uuid: data.id });

  return NextResponse.json({ content: data }, { status: 201 });
}
