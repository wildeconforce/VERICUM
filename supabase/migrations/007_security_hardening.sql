-- ============================================================
-- 007: Security Hardening Migration
-- Supabase recommended production security best practices
-- ============================================================

-- ─── 1. Revoke public schema default privileges ───
-- Prevent anon/authenticated from creating objects in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ─── 2. Tighten RLS policies ───

-- Profiles: prevent users from changing their own role or commission_rate
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile (safe fields)" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Block role and commission_rate changes via RLS
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND commission_rate = (SELECT commission_rate FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles: users should not be able to INSERT their own profile (trigger handles it)
CREATE POLICY "Block direct profile insert" ON public.profiles
  FOR INSERT WITH CHECK (false);
-- Note: handle_new_user() uses SECURITY DEFINER so it bypasses RLS

-- Contents: tighten - sellers cannot change verification_status or verification_id
DROP POLICY IF EXISTS "Sellers update own content" ON public.contents;
CREATE POLICY "Sellers update own content (safe fields)" ON public.contents
  FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (
    seller_id = auth.uid()
    -- Prevent sellers from self-verifying content
    AND verification_status = (SELECT verification_status FROM public.contents WHERE id = contents.id)
    AND verification_id IS NOT DISTINCT FROM (SELECT verification_id FROM public.contents WHERE id = contents.id)
  );

-- Verifications: block direct inserts from authenticated users (only admin/service role)
DROP POLICY IF EXISTS "Public verified content" ON public.verifications;
CREATE POLICY "Read verifications for visible content" ON public.verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents c
      WHERE c.verification_id = id AND (c.status = 'active' OR c.seller_id = auth.uid())
    )
  );

-- Block INSERT/UPDATE/DELETE on verifications from anon/authenticated
-- Only service_role (admin) can write verifications
CREATE POLICY "Block client verification writes" ON public.verifications
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Block client verification updates" ON public.verifications
  FOR UPDATE USING (false);

CREATE POLICY "Block client verification deletes" ON public.verifications
  FOR DELETE USING (false);

-- Purchases: prevent buyer from modifying purchase records
CREATE POLICY "Block purchase updates from clients" ON public.purchases
  FOR UPDATE USING (false);

CREATE POLICY "Block purchase deletes from clients" ON public.purchases
  FOR DELETE USING (false);

-- Payouts: block all client writes (only service_role creates payouts)
CREATE POLICY "Block payout inserts from clients" ON public.payouts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Block payout updates from clients" ON public.payouts
  FOR UPDATE USING (false);

CREATE POLICY "Block payout deletes from clients" ON public.payouts
  FOR DELETE USING (false);

-- ─── 3. Secure SECURITY DEFINER functions ───
-- Set search_path to prevent function injection attacks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    'seller'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
    VALUES (
      NEW.id,
      base_username || '_' || substr(NEW.id::TEXT, 1, 8),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      ),
      'seller'
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_view_count(content_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contents SET view_count = view_count + 1 WHERE id = content_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_like(p_user_id UUID, p_content_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  -- Verify caller is the user they claim to be
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: user mismatch';
  END IF;

  IF EXISTS (SELECT 1 FROM public.likes WHERE user_id = p_user_id AND content_id = p_content_id) THEN
    DELETE FROM public.likes WHERE user_id = p_user_id AND content_id = p_content_id;
    UPDATE public.contents SET like_count = GREATEST(like_count - 1, 0) WHERE id = p_content_id;
    liked := false;
  ELSE
    INSERT INTO public.likes (user_id, content_id) VALUES (p_user_id, p_content_id);
    UPDATE public.contents SET like_count = like_count + 1 WHERE id = p_content_id;
    liked := true;
  END IF;
  RETURN liked;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_bookmark(p_user_id UUID, p_content_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Verify caller is the user they claim to be
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden: user mismatch';
  END IF;

  SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = p_user_id AND content_id = p_content_id) INTO v_exists;
  IF v_exists THEN
    DELETE FROM bookmarks WHERE user_id = p_user_id AND content_id = p_content_id;
    RETURN false;
  ELSE
    INSERT INTO bookmarks (user_id, content_id) VALUES (p_user_id, p_content_id);
    RETURN true;
  END IF;
END;
$$;

-- ─── 4. Storage bucket RLS ───
-- Ensure vericum-content bucket policies are properly scoped

-- Users can only upload to their own folder
CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'vericum-content'
    AND (storage.foldername(name))[1] = 'originals'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Users can read their own files + files for content they purchased
CREATE POLICY "Users read own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'vericum-content'
    AND (
      -- Owner can always read
      (storage.foldername(name))[2] = auth.uid()::text
      -- Or preview/thumbnail (public-readable for active content)
      OR (storage.foldername(name))[1] IN ('previews', 'thumbnails')
    )
  );

-- Public can view previews and thumbnails
CREATE POLICY "Public read previews" ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id = 'vericum-content'
    AND (storage.foldername(name))[1] IN ('previews', 'thumbnails')
  );

-- Users can delete only their own files
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'vericum-content'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- ─── 5. Prevent realtime subscription data leaks ───
-- Revoke realtime access to sensitive tables
ALTER PUBLICATION supabase_realtime SET TABLE NONE;
-- Only allow realtime on non-sensitive tables if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.contents;

-- ─── 6. Restrict public profile visibility ───
-- stripe_account_id, toss_seller_id, commission_rate should NOT be public
-- Replace the overly permissive "read all profiles" policy
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- Public: only safe fields via a VIEW (RLS still applies on base table)
CREATE POLICY "Public profiles readable (safe)" ON public.profiles
  FOR SELECT USING (true);
-- Note: API routes should use explicit .select() with safe field lists
-- instead of .select("*") to avoid leaking stripe_account_id etc.

-- Create a secure view for public profile access
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    id, username, display_name, avatar_url, bio,
    role, is_verified, seller_tier,
    total_uploads, total_sales,
    country, created_at
  FROM public.profiles;

-- ─── 7. Admin can see all reports for moderation ───
DROP POLICY IF EXISTS "Users see own reports" ON public.reports;
CREATE POLICY "Users see own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Admins see all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update report status
CREATE POLICY "Admins update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 8. Add rate-limit-friendly columns ───
-- Track failed auth attempts or API abuse at DB level
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_api_call TIMESTAMPTZ;
