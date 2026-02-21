-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles readable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Contents
CREATE POLICY "Active content readable" ON public.contents
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers create content" ON public.contents
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers update own content" ON public.contents
  FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Sellers delete own content" ON public.contents
  FOR DELETE USING (seller_id = auth.uid());

-- Verifications
CREATE POLICY "Public verified content" ON public.verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents c
      WHERE c.verification_id = id AND (c.status = 'active' OR c.seller_id = auth.uid())
    )
  );

-- Purchases
CREATE POLICY "Buyers see own purchases" ON public.purchases
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "System creates purchases" ON public.purchases
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Payouts
CREATE POLICY "Sellers see own payouts" ON public.payouts
  FOR SELECT USING (seller_id = auth.uid());

-- Likes
CREATE POLICY "Users see all likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users manage own likes" ON public.likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own likes" ON public.likes
  FOR DELETE USING (user_id = auth.uid());

-- Reports
CREATE POLICY "Users create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users see own reports" ON public.reports
  FOR SELECT USING (reporter_id = auth.uid());
