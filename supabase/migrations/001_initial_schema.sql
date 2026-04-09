-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  bio             TEXT,
  role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  is_verified     BOOLEAN DEFAULT false,
  seller_tier     VARCHAR(20) DEFAULT 'basic' CHECK (seller_tier IN ('basic', 'pro', 'premium')),
  commission_rate DECIMAL(4,2) DEFAULT 20.00,
  stripe_account_id    VARCHAR(255),
  toss_seller_id       VARCHAR(255),
  total_uploads   INTEGER DEFAULT 0,
  total_sales     INTEGER DEFAULT 0,
  total_earnings  DECIMAL(12,2) DEFAULT 0.00,
  country         VARCHAR(2),
  language        VARCHAR(5) DEFAULT 'en',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Verifications (created before contents since contents references it)
CREATE TABLE public.verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL, -- FK added after contents table
  has_c2pa        BOOLEAN DEFAULT false,
  c2pa_manifest   JSONB,
  c2pa_issuer     VARCHAR(255),
  c2pa_timestamp  TIMESTAMPTZ,
  content_hash    VARCHAR(64) NOT NULL,
  perceptual_hash VARCHAR(64),
  exif_data       JSONB,
  device_info     JSONB,
  capture_date    TIMESTAMPTZ,
  gps_location    JSONB,
  ai_score        DECIMAL(5,4),
  ai_detector     VARCHAR(50),
  ai_details      JSONB,
  overall_score   DECIMAL(5,4),
  status          VARCHAR(20) DEFAULT 'processing'
    CHECK (status IN ('processing', 'verified', 'rejected', 'manual_review')),
  rejection_reason TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id),
  provenance      JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Contents
CREATE TABLE public.contents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  content_type    VARCHAR(20) NOT NULL CHECK (content_type IN ('photo', 'video', 'document', 'audio')),
  original_url    TEXT NOT NULL,
  preview_url     TEXT,
  thumbnail_url   TEXT,
  file_size       BIGINT,
  file_format     VARCHAR(20),
  dimensions      JSONB,
  duration        INTEGER,
  price           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  license_type    VARCHAR(20) DEFAULT 'standard' CHECK (license_type IN ('personal', 'standard', 'extended', 'exclusive')),
  verification_status  VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'unverifiable')),
  verification_id      UUID REFERENCES public.verifications(id),
  tags            TEXT[] DEFAULT '{}',
  category        VARCHAR(50),
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,
  like_count      INTEGER DEFAULT 0,
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'removed')),
  is_featured     BOOLEAN DEFAULT false,
  meta_title      VARCHAR(255),
  meta_description VARCHAR(500),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from verifications to contents
ALTER TABLE public.verifications
  ADD CONSTRAINT fk_verifications_content
  FOREIGN KEY (content_id) REFERENCES public.contents(id) ON DELETE CASCADE;

-- Purchases
CREATE TABLE public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES public.profiles(id),
  content_id      UUID NOT NULL REFERENCES public.contents(id),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  commission_amount DECIMAL(10,2) NOT NULL,
  seller_amount   DECIMAL(10,2) NOT NULL,
  license_type    VARCHAR(20) NOT NULL,
  license_key     VARCHAR(100) UNIQUE NOT NULL,
  payment_provider VARCHAR(20) CHECK (payment_provider IN ('stripe', 'toss')),
  payment_id       VARCHAR(255),
  payment_status   VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
  download_count   INTEGER DEFAULT 0,
  max_downloads    INTEGER DEFAULT 10,
  download_expires TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE public.payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  provider        VARCHAR(20) CHECK (provider IN ('stripe', 'toss', 'bank_transfer')),
  provider_payout_id VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Likes
CREATE TABLE public.likes (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id)
);

-- Reports
CREATE TABLE public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES public.profiles(id),
  content_id      UUID NOT NULL REFERENCES public.contents(id),
  reason          VARCHAR(50) NOT NULL CHECK (reason IN ('copyright', 'fake', 'inappropriate', 'spam', 'other')),
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER contents_updated_at BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER verifications_updated_at BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
