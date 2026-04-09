import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FILE_LIMITS, CONTENT_TYPES } from "@/lib/constants";

// Build a flat set of all allowed extensions
const ALLOWED_EXTENSIONS: Set<string> = new Set(
  Object.values(FILE_LIMITS).flatMap((v) => [...v.formats])
);

export async function POST(request: NextRequest) {
  // Auth check via the cookie-based server client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filename, content_type } = body;

  if (!filename || typeof filename !== "string" || !content_type || typeof content_type !== "string") {
    return NextResponse.json({ error: "filename and content_type required" }, { status: 400 });
  }

  // Validate content_type enum
  if (!(CONTENT_TYPES as readonly string[]).includes(content_type)) {
    return NextResponse.json({ error: `Invalid content_type. Must be one of: ${CONTENT_TYPES.join(", ")}` }, { status: 400 });
  }

  const ext = filename.split(".").pop()?.toLowerCase();

  // Validate file extension
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Invalid file extension: .${ext}` }, { status: 400 });
  }

  // Validate extension matches the declared content_type
  const typeConfig = FILE_LIMITS[content_type as keyof typeof FILE_LIMITS];
  if (!typeConfig || !(typeConfig.formats as readonly string[]).includes(ext)) {
    return NextResponse.json(
      { error: `Extension .${ext} is not allowed for content type "${content_type}"` },
      { status: 400 }
    );
  }

  const contentId = crypto.randomUUID();
  const fileKey = `originals/${user.id}/${contentId}/original.${ext}`;

  // Use admin client (service role) to create signed upload URL.
  // The anon-key client can fail here due to storage RLS policies.
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("vericum-content")
    .createSignedUploadUrl(fileKey);

  if (error) {
    console.error("Upload signed URL error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    upload_url: data.signedUrl,
    file_key: fileKey,
    content_id: contentId,
    max_size: typeConfig.maxSize,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  });
}
