-- ============================================================
-- 009: Fix default role for new users
-- New users should default to 'user' role
-- Elevated role should be granted through explicit upgrade flow
-- ============================================================

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
    'user'  -- Default to 'user' (basic role)
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
      'user'  -- Default to 'user' (basic role)
    );
    RETURN NEW;
END;
$$;

-- Add atomic download count increment function to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_download_count(purchase_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INT;
  max_count INT;
BEGIN
  SELECT download_count, COALESCE(max_downloads, 10)
  INTO current_count, max_count
  FROM public.purchases
  WHERE id = purchase_uuid
  FOR UPDATE;  -- Row-level lock to prevent race condition

  IF current_count >= max_count THEN
    RETURN FALSE;
  END IF;

  UPDATE public.purchases
  SET download_count = download_count + 1
  WHERE id = purchase_uuid;

  RETURN TRUE;
END;
$$;
