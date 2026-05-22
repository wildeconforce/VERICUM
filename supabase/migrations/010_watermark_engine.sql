-- =====================================================
-- Migration 010 — Watermark Engine (Phase 2, Layer B)
-- =====================================================
-- Adds per-buyer forensic watermark columns to purchases.
-- Adds watermark_enabled flag to contents.
-- Follows column-level RLS pattern from migration 008.
--
-- Spec: docs/phase2-watermark-spec.md
-- Migration order: 010 (after 009_fix_default_role.sql)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. purchases — per-sale watermark columns
-- =====================================================

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS watermark_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS watermark_status VARCHAR(20)
    CHECK (watermark_status IN ('pending', 'processing', 'complete', 'failed')),
  ADD COLUMN IF NOT EXISTS watermark_algorithm VARCHAR(30),
  ADD COLUMN IF NOT EXISTS watermark_version SMALLINT,
  ADD COLUMN IF NOT EXISTS watermark_strength NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS watermarked_file_key TEXT,
  ADD COLUMN IF NOT EXISTS watermarked_at TIMESTAMPTZ;

-- Unique index on watermark_token. Detection does indexed O(1) lookup.
-- Partial index (WHERE NOT NULL) keeps existing rows valid.
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_watermark_token
  ON public.purchases(watermark_token)
  WHERE watermark_token IS NOT NULL;

COMMENT ON COLUMN public.purchases.watermark_token IS
  'Forensic identifier. HMAC-SHA256(secret, "vericum-wm-v1:" + id), first 64 bits hex. Server-role read only.';
COMMENT ON COLUMN public.purchases.watermark_status IS
  'pending / processing / complete / failed';
COMMENT ON COLUMN public.purchases.watermark_algorithm IS
  'e.g. dwt-dct-svd-v1';
COMMENT ON COLUMN public.purchases.watermark_version IS
  'Scheme version for future rotation';
COMMENT ON COLUMN public.purchases.watermark_strength IS
  'Embed strength used. Required for audit reproducibility';
COMMENT ON COLUMN public.purchases.watermarked_file_key IS
  'Storage path of the cached marked copy. Lazy populate on first download';

-- =====================================================
-- 2. contents — per-listing enable flag
-- =====================================================

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.contents.watermark_enabled IS
  'Whether sold copies of this content get a per-buyer watermark. Default true.';

-- =====================================================
-- 3. Column-level GRANT (migration 008 pattern)
-- =====================================================
-- watermark_token must never leak to the buyer.
-- A buyer who can read it could try to locate and scrub it.
-- service_role retains full access (Stripe webhook + watermark route).
-- =====================================================

-- Revoke broad SELECT first, then re-grant only safe columns.
REVOKE SELECT ON public.purchases FROM authenticated;
REVOKE SELECT ON public.purchases FROM anon;

-- authenticated buyer: safe columns only.
-- watermark_token, watermarked_file_key are intentionally EXCLUDED.
GRANT SELECT (
  id,
  buyer_id,
  content_id,
  seller_id,
  amount,
  currency,
  commission_amount,
  seller_amount,
  license_type,
  license_key,
  payment_provider,
  payment_id,
  payment_status,
  download_count,
  max_downloads,
  download_expires,
  created_at,
  watermark_status,
  watermark_algorithm,
  watermark_version,
  watermarked_at
) ON public.purchases TO authenticated;

-- anon: even more restrictive (most queries should require auth anyway)
GRANT SELECT (
  id,
  content_id,
  seller_id,
  amount,
  currency,
  license_type,
  payment_status,
  created_at
) ON public.purchases TO anon;

-- service_role keeps full access. Default GRANT is preserved.

COMMIT;
