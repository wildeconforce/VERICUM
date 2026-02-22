-- Fix handle_new_user trigger for Google OAuth:
-- 1. Default role changed to 'seller' so all users can upload
-- 2. Username conflict handled with unique suffix
-- 3. Google OAuth metadata fields properly mapped

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  -- Build base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Ensure username is unique by appending a numeric suffix if needed
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
    -- If somehow we still hit a conflict, use UUID suffix
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update default role in schema
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'seller';

-- Upgrade existing users with role='user' to 'seller'
UPDATE public.profiles SET role = 'seller' WHERE role = 'user';
