import { createHash } from "crypto";
import { HashResult } from "./types";

export async function generateHashes(buffer: Buffer): Promise<HashResult> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  // For MVP, perceptual hash is simplified
  // Post-MVP: integrate proper pHash library
  let perceptualHash: string | null = null;
  try {
    // Simple average hash as placeholder
    perceptualHash = createHash("md5").update(buffer.subarray(0, Math.min(buffer.length, 1024))).digest("hex");
  } catch {
    // perceptual hash generation failed, non-critical
  }

  return { sha256, perceptualHash };
}

export async function checkDuplicateHash(
  sha256: string,
  supabaseAdmin: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => Promise<{ data: unknown[] | null }> } } }
): Promise<{ isDuplicate: boolean; similarContentIds: string[] }> {
  const { data } = await supabaseAdmin
    .from("verifications")
    .select("content_id")
    .eq("content_hash", sha256);

  const ids = (data as { content_id: string }[] | null)?.map((d) => d.content_id) || [];
  return {
    isDuplicate: ids.length > 0,
    similarContentIds: ids,
  };
}
