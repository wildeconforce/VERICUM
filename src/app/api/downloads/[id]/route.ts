import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user purchased this content
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("buyer_id", user.id)
    .eq("content_id", contentId)
    .eq("payment_status", "completed")
    .single();

  if (!purchase) {
    return NextResponse.json({ error: "Not purchased" }, { status: 403 });
  }

  // Check download expiry
  if (purchase.download_expires && new Date(purchase.download_expires) < new Date()) {
    return NextResponse.json({ error: "Download link expired" }, { status: 410 });
  }

  // Check download limit
  if (purchase.download_count >= (purchase.max_downloads || 10)) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 429 });
  }

  // Get content file URL — use original_url (the actual storage key)
  const { data: content } = await supabase
    .from("contents")
    .select("original_url, title")
    .eq("id", contentId)
    .single();

  if (!content?.original_url) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Atomically increment download count to prevent race conditions
  const { data: allowed } = await supabase.rpc(
    "increment_download_count" as any,
    { purchase_uuid: purchase.id }
  );

  if (allowed === false) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 429 });
  }

  // Increment content-level download count
  await supabase.rpc("increment_view_count" as any, { content_uuid: contentId });

  // Generate signed URL for the file
  const { data: signedUrl } = await supabase.storage
    .from("vericum-content")
    .createSignedUrl(content.original_url, 300); // 5 minutes expiry

  if (!signedUrl) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.json({ download_url: signedUrl.signedUrl });
}
