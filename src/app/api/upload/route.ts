import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content_type, file_size } = body;

  if (!filename || !content_type) {
    return NextResponse.json({ error: "filename and content_type required" }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  const contentId = crypto.randomUUID();
  const fileKey = `originals/${user.id}/${contentId}/original.${ext}`;

  // Create signed upload URL
  const { data, error } = await supabase.storage
    .from("vericum-content")
    .createSignedUploadUrl(fileKey);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    upload_url: data.signedUrl,
    file_key: fileKey,
    content_id: contentId,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });
}
