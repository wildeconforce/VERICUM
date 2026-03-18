import { createHash } from "crypto";
import { HashResult } from "./types";
import { computePerceptualHash, hammingDistance } from "./phash";

export async function generateHashes(buffer: Buffer): Promise<HashResult> {
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  // Compute real DCT-based perceptual hash
  let perceptualHash: string | null = null;
  try {
    perceptualHash = await computePerceptualHash(buffer);
  } catch {
    // pHash generation failed, non-critical
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

/**
 * Check for perceptually similar images in the database.
 * Uses Hamming distance on pHash values.
 * Returns matching content IDs with similarity scores.
 */
export async function checkPerceptualDuplicates(
  perceptualHash: string,
  supabaseAdmin: {
    from: (table: string) => {
      select: (columns: string) => {
        neq: (column: string, value: null) => Promise<{ data: unknown[] | null }>;
      };
    };
  },
  threshold = 10
): Promise<{ contentId: string; distance: number }[]> {
  const { data } = await supabaseAdmin
    .from("verifications")
    .select("content_id, perceptual_hash")
    .neq("perceptual_hash", null);

  if (!data) return [];

  const matches: { contentId: string; distance: number }[] = [];
  for (const row of data as { content_id: string; perceptual_hash: string }[]) {
    if (!row.perceptual_hash) continue;
    const dist = hammingDistance(perceptualHash, row.perceptual_hash);
    if (dist <= threshold) {
      matches.push({ contentId: row.content_id, distance: dist });
    }
  }

  return matches.sort((a, b) => a.distance - b.distance);
}
