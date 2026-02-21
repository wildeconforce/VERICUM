import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyContent } from "@/lib/c2pa/verify";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content_id, file_key } = body;

  if (!content_id || !file_key) {
    return NextResponse.json({ error: "content_id and file_key required" }, { status: 400 });
  }

  try {
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("vericum-content")
      .download(file_key);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const adminClient = createAdminClient();

    // Run verification
    const result = await verifyContent(
      {
        fileBuffer: buffer,
        fileName: file_key.split("/").pop() || "unknown",
        mimeType: fileData.type || "image/jpeg",
      },
      adminClient
    );

    // Store verification result
    const { data: verification, error: insertError } = await adminClient
      .from("verifications")
      .insert({
        content_id,
        has_c2pa: result.c2pa.present,
        c2pa_manifest: result.c2pa.manifest as any,
        c2pa_issuer: result.c2pa.issuer,
        c2pa_timestamp: result.c2pa.timestamp?.toISOString(),
        content_hash: "", // Will be set below
        perceptual_hash: null,
        exif_data: result.metadata as any,
        device_info: null,
        capture_date: result.metadata.captureDate?.toISOString(),
        ai_score: result.aiDetection.isAiGenerated ? 1 - result.aiDetection.score : result.aiDetection.score,
        ai_detector: result.aiDetection.detector,
        overall_score: result.overallScore,
        status: result.status === "manual_review" ? "manual_review" : result.status,
        provenance: result.provenance as any,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update content verification status
    const contentStatus = result.status === "verified" ? "verified" :
                          result.status === "rejected" ? "rejected" : "pending";

    await adminClient
      .from("contents")
      .update({
        verification_status: contentStatus,
        verification_id: verification.id,
        status: result.status === "verified" ? "active" : "draft",
      })
      .eq("id", content_id);

    return NextResponse.json({
      verification_id: verification.id,
      status: result.status,
      has_c2pa: result.c2pa.present,
      ai_score: result.aiDetection.score,
      overall_score: result.overallScore,
      provenance: result.provenance,
    });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
