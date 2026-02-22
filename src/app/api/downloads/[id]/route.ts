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

  // Check download limit
  if (purchase.download_count >= (purchase.max_downloads || 10)) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 429 });
  }

  // Get content file URL
  const { data: content } = await supabase
    .from("contents")
    .select("file_url, title")
    .eq("id", contentId)
    .single();

  if (!content?.file_url) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Increment download count
  await supabase
    .from("purchases")
    .update({ download_count: (purchase.download_count || 0) + 1 } as never)
    .eq("id", purchase.id);

  // Increment content download count
  await supabase.rpc("increment_download_count" as any, { content_uuid: contentId });

  // Generate signed URL for the file
  const filePath = content.file_url.split("/storage/v1/object/public/")[1] || content.file_url;
  const { data: signedUrl } = await supabase.storage
    .from("contents")
    .createSignedUrl(filePath, 300); // 5 minutes expiry

  if (!signedUrl) {
    // Fall back to direct URL
    return NextResponse.json({ download_url: content.file_url });
  }

  return NextResponse.json({ download_url: signedUrl.signedUrl });
}
