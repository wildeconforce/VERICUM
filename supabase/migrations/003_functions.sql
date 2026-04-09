-- Search function
CREATE OR REPLACE FUNCTION search_contents(
  search_query TEXT,
  content_type_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  verified_only BOOLEAN DEFAULT true,
  page_num INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  thumbnail_url TEXT,
  price DECIMAL,
  verification_status VARCHAR,
  seller_name VARCHAR,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.title, c.description, c.thumbnail_url, c.price,
    c.verification_status,
    p.display_name as seller_name,
    ts_rank(
      to_tsvector('english', coalesce(c.title, '') || ' ' || coalesce(c.description, '') || ' ' || array_to_string(c.tags, ' ')),
      plainto_tsquery('english', search_query)
    ) as relevance
  FROM public.contents c
  JOIN public.profiles p ON c.seller_id = p.id
  WHERE c.status = 'active'
    AND (NOT verified_only OR c.verification_status = 'verified')
    AND (content_type_filter IS NULL OR c.content_type = content_type_filter)
    AND (category_filter IS NULL OR c.category = category_filter)
    AND (min_price IS NULL OR c.price >= min_price)
    AND (max_price IS NULL OR c.price <= max_price)
    AND (
      to_tsvector('english', coalesce(c.title, '') || ' ' || coalesce(c.description, '') || ' ' || array_to_string(c.tags, ' '))
      @@ plainto_tsquery('english', search_query)
      OR c.title ILIKE '%' || search_query || '%'
    )
  ORDER BY relevance DESC, c.created_at DESC
  LIMIT page_size
  OFFSET (page_num - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.contents SET view_count = view_count + 1 WHERE id = content_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle like
CREATE OR REPLACE FUNCTION toggle_like(p_user_id UUID, p_content_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  IF EXISTS (SELECT 1 FROM public.likes WHERE user_id = p_user_id AND content_id = p_content_id) THEN
    DELETE FROM public.likes WHERE user_id = p_user_id AND content_id = p_content_id;
    UPDATE public.contents SET like_count = like_count - 1 WHERE id = p_content_id;
    liked := false;
  ELSE
    INSERT INTO public.likes (user_id, content_id) VALUES (p_user_id, p_content_id);
    UPDATE public.contents SET like_count = like_count + 1 WHERE id = p_content_id;
    liked := true;
  END IF;
  RETURN liked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
