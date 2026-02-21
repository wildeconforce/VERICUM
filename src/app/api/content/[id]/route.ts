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

  // Generate public URL from file_key if preview_url is missing
  if (!content.preview_url && content.original_url) {
    const { data: publicUrlData } = supabase.storage
      .from("vericum-content")
      .getPublicUrl(content.original_url);
    if (publicUrlData?.publicUrl) {
      (content as any).preview_url = publicUrlData.publicUrl;
    }
  }

  // Get seller profile
  const { data: seller } = await supabase
    .from("profiles")
    .select("*")
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

  return NextResponse.json({
    content,
    verification,
    seller,
    related: related || [],
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

  const { data, error } = await supabase
    .from("contents")
    .update(body as never)
    .eq("id", id)
    .eq("seller_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const { error } = await supabase
    .from("contents")
    .update({ status: "removed" } as never)
    .eq("id", id)
    .eq("seller_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}