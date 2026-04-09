-- Performance indexes
CREATE INDEX idx_contents_seller ON public.contents(seller_id);
CREATE INDEX idx_contents_status ON public.contents(status, verification_status);
CREATE INDEX idx_contents_category ON public.contents(category);
CREATE INDEX idx_contents_created ON public.contents(created_at DESC);
CREATE INDEX idx_contents_price ON public.contents(price);
CREATE INDEX idx_contents_tags ON public.contents USING GIN(tags);
CREATE INDEX idx_contents_search ON public.contents USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX idx_purchases_seller ON public.purchases(seller_id);
CREATE INDEX idx_purchases_content ON public.purchases(content_id);

CREATE INDEX idx_verifications_content ON public.verifications(content_id);
CREATE INDEX idx_verifications_status ON public.verifications(status);
CREATE INDEX idx_verifications_hash ON public.verifications(content_hash);

CREATE INDEX idx_likes_content ON public.likes(content_id);
CREATE INDEX idx_payouts_seller ON public.payouts(seller_id);
CREATE INDEX idx_reports_content ON public.reports(content_id);
CREATE INDEX idx_reports_status ON public.reports(status);
