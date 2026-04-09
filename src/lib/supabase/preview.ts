import { SupabaseClient } from "@supabase/supabase-js";

const SIGNED_URL_TTL = 3600; // 1 hour

/**
 * For each content item, generates a signed preview URL from original_url
 * when both thumbnail_url and preview_url are missing.
 * Mutates items in-place and returns the array.
 */
export async function attachPreviewUrls<
  T extends { thumbnail_url?: string | null; preview_url?: string | null; original_url?: string | null },
>(
  supabase: SupabaseClient,
  items: T[],
): Promise<T[]> {
  const needsUrl = items.filter(
    (item) => !item.thumbnail_url && !item.preview_url && item.original_url,
  );

  if (needsUrl.length === 0) return items;

  // Batch: generate signed URLs concurrently
  await Promise.all(
    needsUrl.map(async (item) => {
      const { data } = await supabase.storage
        .from("vericum-content")
        .createSignedUrl(item.original_url!, SIGNED_URL_TTL);
      if (data?.signedUrl) {
        (item as any).preview_url = data.signedUrl;
      }
    }),
  );

  return items;
}
