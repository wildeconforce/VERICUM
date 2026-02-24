-- Atomically increment seller earnings and sales count
CREATE OR REPLACE FUNCTION increment_seller_earnings(seller_uuid UUID, earning_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_earnings = COALESCE(total_earnings, 0) + earning_amount,
    total_sales = COALESCE(total_sales, 0) + 1
  WHERE id = seller_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment download count and enforce limit
CREATE OR REPLACE FUNCTION increment_download_count(purchase_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT download_count, COALESCE(max_downloads, 10)
  INTO current_count, max_count
  FROM public.purchases
  WHERE id = purchase_uuid
  FOR UPDATE;

  IF current_count >= max_count THEN
    RETURN false;
  END IF;

  UPDATE public.purchases
  SET download_count = download_count + 1
  WHERE id = purchase_uuid;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
