-- Add sale_type and royalty fields to contents
ALTER TABLE contents ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'premium' CHECK (sale_type IN ('premium', 'royalty'));
ALTER TABLE contents ADD COLUMN IF NOT EXISTS royalty_rate numeric DEFAULT 0 CHECK (royalty_rate >= 0 AND royalty_rate <= 0.10);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, content_id)
);

-- Enable RLS on bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Toggle bookmark function
CREATE OR REPLACE FUNCTION toggle_bookmark(p_user_id uuid, p_content_id uuid)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = p_user_id AND content_id = p_content_id) INTO v_exists;
  IF v_exists THEN
    DELETE FROM bookmarks WHERE user_id = p_user_id AND content_id = p_content_id;
    RETURN false;
  ELSE
    INSERT INTO bookmarks (user_id, content_id) VALUES (p_user_id, p_content_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for faster bookmark lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content_id ON bookmarks(content_id);

-- Add download tracking to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS max_downloads integer DEFAULT 10;
