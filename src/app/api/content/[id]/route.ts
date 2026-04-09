import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ContentRow = Database["public"]["Tables"]["contents"]["Row"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Increment view count (fire and forget)
  void (supabase.rpc as Function)("increment_view_count", { content_uuid: id });

  const { data, error } = await supabase
    .from("contents")
    .select("*")
    .eq("id", id)
    .single();

  const content = data as ContentRow | null;

  if (error || !content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  // Generate signed URL from original_url if preview_url is missing
  if (!content.preview_url && content.original_url) {
    const { data: signedUrlData } = await supabase.storage
      .from("vericum-content")
      .createSignedUrl(content.original_url, 3600);
    if (signedUrlData?.signedUrl) {
      (content as any).preview_url = signedUrlData.signedUrl;
    }
  }

  // Get seller profile (safe fields only - exclude stripe_account_id, commission_rate, etc.)
  const { data: seller } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, is_verified, seller_tier, total_sales")
    .eq("id", content.seller_id)
    .single();

  // Get verification
  let verification = null;
  if (content.verification_id) {
    const { data: v } = await supabase
      .from("verifications")
      .select("*")
      .eq("id", content.verification_id)
      .single();
    verification = v;
  }

  // Get related content
  const { data: related } = await supabase
    .from("contents")
    .select("*")
    .eq("status", "active")
    .neq("id", id)
    .limit(4);

  // Generate signed URLs for related content previews
  const relatedWithPreviews = await Promise.all(
    (related || []).map(async (item: any) => {
      if (!item.preview_url && item.original_url) {
        const { data: signedUrlData } = await supabase.storage
          .from("vericum-content")
          .createSignedUrl(item.original_url, 3600);
        if (signedUrlData?.signedUrl) {
          item.preview_url = signedUrlData.signedUrl;
        }
      }
      return item;
    })
  );

  return NextResponse.json({
    content,
    verification,
    seller,
    related: relatedWithPreviews,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Whitelist allowed fields to prevent mass-assignment attacks
  const ALLOWED_FIELDS = [
    "title", "description", "price", "currency", "license_type",
    "tags", "category", "status", "sale_type", "royalty_rate",
    "meta_title", "meta_description",
  ] as const;

  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) sanitized[key] = body[key];
  }

  // Validate price if being updated
  if ("price" in sanitized) {
    const p = sanitized.price;
    if (typeof p !== "number" || !isFinite(p) || p < 0.50 || p > 50000) {
      return NextResponse.json({ error: "Price must be between $0.50 and $50,000" }, { status: 400 });
    }
    sanitized.price = Math.round(p * 100) / 100;
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contents")
    .update(sanitized as never)
    .eq("id", id)
    .eq("seller_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Content update error:", error);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Content not found or not owned by you" }, { status: 404 });
  }

  return NextResponse.json({ content: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("contents")
    .update({ status: "removed" } as never)
    .eq("id", id)
    .eq("seller_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Content delete error:", error);
    return NextResponse.json({ error: "Failed to remove content" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Content not found or not owned by you" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
