-- ============================================================
-- 008: Performance & Deep Security Optimization
-- Supabase 2025 best practices:
--   - initPlan optimization for RLS (15-61% perf gain)
--   - FORCE ROW LEVEL SECURITY on all tables
--   - Column-level REVOKE/GRANT on profiles
--   - Storage bucket file size & MIME restrictions
-- ============================================================

-- ─── 1. FORCE ROW LEVEL SECURITY ───
-- Ensures RLS applies even to the table owner (defense-in-depth)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.verifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.purchases FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payouts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks FORCE ROW LEVEL SECURITY;

-- ─── 2. initPlan optimization ───
-- Wrap auth.uid() in (SELECT auth.uid()) so PostgreSQL evaluates it once
-- as an initPlan instead of per-row. This gives 15-61% performance boost
-- on large tables. Reference: supabase.com/docs/guides/database/postgres/row-level-security

-- ── 2a. Profiles policies ──
DROP POLICY IF EXISTS "Public profiles readable (safe)" ON public.profiles;
CREATE POLICY "Public profiles readable (safe)" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile (safe fields)" ON public.profiles;
CREATE POLICY "Users update own profile (safe fields)" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND role = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    AND commission_rate = (SELECT commission_rate FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Block direct profile insert" ON public.profiles;
CREATE POLICY "Block direct profile insert" ON public.profiles
  FOR INSERT WITH CHECK (false);

-- ── 2b. Contents policies ──
DROP POLICY IF EXISTS "Active content readable" ON public.contents;
CREATE POLICY "Active content readable" ON public.contents
  FOR SELECT USING (status = 'active' OR seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Sellers create content" ON public.contents;
CREATE POLICY "Sellers create content" ON public.contents
  FOR INSERT WITH CHECK (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Sellers update own content (safe fields)" ON public.contents;
CREATE POLICY "Sellers update own content (safe fields)" ON public.contents
  FOR UPDATE USING (seller_id = (SELECT auth.uid()))
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    AND verification_status = (SELECT verification_status FROM public.contents WHERE id = contents.id)
    AND verification_id IS NOT DISTINCT FROM (SELECT verification_id FROM public.contents WHERE id = contents.id)
  );

DROP POLICY IF EXISTS "Sellers delete own content" ON public.contents;
CREATE POLICY "Sellers delete own content" ON public.contents
  FOR DELETE USING (seller_id = (SELECT auth.uid()));

-- ── 2c. Verifications policies ──
DROP POLICY IF EXISTS "Read verifications for visible content" ON public.verifications;
CREATE POLICY "Read verifications for visible content" ON public.verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents c
      WHERE c.verification_id = id AND (c.status = 'active' OR c.seller_id = (SELECT auth.uid()))
    )
  );

-- Block policies stay as-is (they use false, no auth.uid() needed)

-- ── 2d. Purchases policies ──
DROP POLICY IF EXISTS "Buyers see own purchases" ON public.purchases;
CREATE POLICY "Buyers see own purchases" ON public.purchases
  FOR SELECT USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System creates purchases" ON public.purchases;
CREATE POLICY "System creates purchases" ON public.purchases
  FOR INSERT WITH CHECK (buyer_id = (SELECT auth.uid()));

-- Block policies stay as-is

-- ── 2e. Payouts policies ──
DROP POLICY IF EXISTS "Sellers see own payouts" ON public.payouts;
CREATE POLICY "Sellers see own payouts" ON public.payouts
  FOR SELECT USING (seller_id = (SELECT auth.uid()));

-- Block policies stay as-is

-- ── 2f. Likes policies ──
DROP POLICY IF EXISTS "Users manage own likes" ON public.likes;
CREATE POLICY "Users manage own likes" ON public.likes
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users delete own likes" ON public.likes;
CREATE POLICY "Users delete own likes" ON public.likes
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- "Users see all likes" stays as-is (uses true, no auth.uid())

-- ── 2g. Reports policies ──
DROP POLICY IF EXISTS "Users create reports" ON public.reports;
CREATE POLICY "Users create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users see own reports" ON public.reports;
CREATE POLICY "Users see own reports" ON public.reports
  FOR SELECT USING (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins see all reports" ON public.reports;
CREATE POLICY "Admins see all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins update reports" ON public.reports;
CREATE POLICY "Admins update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ── 2h. Bookmarks policies ──
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ── 2i. Storage policies (optimized) ──
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vericum-content'
    AND (storage.foldername(name))[1] = 'originals'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Users read own uploads" ON storage.objects;
CREATE POLICY "Users read own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vericum-content'
    AND (
      (storage.foldername(name))[2] = (SELECT auth.uid())::text
      OR (storage.foldername(name))[1] IN ('previews', 'thumbnails')
    )
  );

DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vericum-content'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

-- "Public read previews" stays as-is (anon role, no auth.uid())

-- ─── 3. Column-level security for profiles ───
-- Defense-in-depth: even if RLS policy is bypassed, only safe columns are writable
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  display_name,
  avatar_url,
  bio,
  country,
  language,
  username
) ON public.profiles TO authenticated;

-- Ensure anon cannot update profiles at all
REVOKE UPDATE ON public.profiles FROM anon;

-- ─── 4. Storage bucket restrictions ───
-- Limit file size to 100MB and restrict to safe MIME types
UPDATE storage.buckets
SET
  file_size_limit = 104857600,  -- 100 MB
  allowed_mime_types = ARRAY[
    -- Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/bmp', 'image/svg+xml',
    -- Videos
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
    -- Documents
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
WHERE id = 'vericum-content';

-- ─── 5. Secure update_updated_at function ───
-- Add SET search_path for defense-in-depth (missed in 007)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
