# VERICUM — MVP Technical Specification
## Complete Build Blueprint for Claude Code
> Version: 1.0
> Date: 2026-02-12
> Stack: Next.js 14 + Supabase + C2PA + Stripe/Toss

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Routes](#6-api-routes)
7. [C2PA Verification Engine](#7-c2pa-verification-engine)
8. [File Upload & Storage](#8-file-upload--storage)
9. [Payment System](#9-payment-system)
10. [Search & Discovery](#10-search--discovery)
11. [Frontend Pages & Components](#11-frontend-pages--components)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [MVP Scope Definition](#14-mvp-scope-definition)

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                   │
│              Next.js 14 (App Router)                 │
│         Server Components + Client Components         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES                   │
│              /api/auth, /api/content,                 │
│          /api/verify, /api/payment, /api/search       │
└───────┬──────────┬──────────┬──────────┬────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│ Supabase │ │ Supabase │ │ C2PA   │ │ Stripe / │
│   Auth   │ │    DB    │ │ Verify │ │   Toss   │
│          │ │ (Postgres)│ │ Engine │ │ Payments │
└──────────┘ └──────────┘ └────────┘ └──────────┘
                  │
                  ▼
           ┌──────────┐
           │ Supabase │
           │ Storage  │
           │ (S3-like)│
           └──────────┘
```

### Core Principles:
- **Server-first**: Next.js Server Components for SEO + performance
- **Edge-ready**: Middleware for auth checks, geolocation
- **Type-safe**: TypeScript everywhere
- **Realtime**: Supabase Realtime for notifications

---

## 2. TECH STACK

### Frontend
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR/SSG, API routes, Server Components |
| Styling | Tailwind CSS v3 | Rapid UI, matches brand system |
| Components | shadcn/ui | Accessible, customizable primitives |
| State | Zustand | Lightweight global state |
| Forms | React Hook Form + Zod | Type-safe validation |
| Icons | Lucide React | Consistent icon system |
| Animations | Framer Motion | Premium interactions |

### Backend
| Layer | Technology | Why |
|-------|-----------|-----|
| Database | Supabase (PostgreSQL) | Free tier, Realtime, RLS, Auth |
| Auth | Supabase Auth | Social login, JWT, RLS integration |
| Storage | Supabase Storage | S3-compatible, direct upload |
| Payments | Stripe (global) + Toss (KR) | Marketplace split payments |
| Email | Resend | Transactional emails |
| Search | Supabase Full-text + pg_trgm | No extra service needed for MVP |

### Verification
| Layer | Technology | Why |
|-------|-----------|-----|
| C2PA | c2pa-js (npm) | Official C2PA JavaScript library |
| Hashing | SHA-256 | Content fingerprinting |
| EXIF | exif-parser | Metadata extraction |
| Image Analysis | Sharp | Resize, thumbnail, format detection |

### DevOps
| Layer | Technology | Why |
|-------|-----------|-----|
| Hosting | Vercel | Zero-config Next.js deployment |
| CDN | Vercel Edge Network | Global asset delivery |
| Monitoring | Vercel Analytics | Core Web Vitals |
| Error Tracking | Sentry | Runtime error capture |

---

## 3. FOLDER STRUCTURE

```
vericum/
├── .env.local                    # Environment variables
├── .env.example                  # Template for env vars
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind + brand tokens
├── tsconfig.json                 # TypeScript config
├── package.json
│
├── public/
│   ├── fonts/                    # Self-hosted fonts (Cormorant, Outfit)
│   ├── images/
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   ├── logo-icon.svg
│   │   └── og-image.png          # Social share image
│   └── manifest.json
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── globals.css           # Global styles + brand tokens
│   │   │
│   │   ├── (auth)/               # Auth group (no layout nesting)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/page.tsx # OAuth callback
│   │   │
│   │   ├── (marketplace)/        # Marketplace group
│   │   │   ├── layout.tsx        # Marketplace layout (nav, footer)
│   │   │   ├── explore/page.tsx  # Browse all content
│   │   │   ├── content/
│   │   │   │   └── [id]/page.tsx # Single content detail
│   │   │   ├── upload/page.tsx   # Upload & verify content
│   │   │   └── search/page.tsx   # Search results
│   │   │
│   │   ├── (dashboard)/          # User dashboard group
│   │   │   ├── layout.tsx        # Dashboard layout (sidebar)
│   │   │   ├── dashboard/page.tsx      # Overview
│   │   │   ├── my-content/page.tsx     # My uploads
│   │   │   ├── purchases/page.tsx      # My purchases
│   │   │   ├── earnings/page.tsx       # Revenue dashboard
│   │   │   └── settings/page.tsx       # Account settings
│   │   │
│   │   ├── (legal)/
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   │
│   │   ├── blog/
│   │   │   ├── page.tsx          # Blog index
│   │   │   └── [slug]/page.tsx   # Blog post
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── auth/
│   │       │   └── callback/route.ts
│   │       ├── content/
│   │       │   ├── route.ts           # GET list, POST create
│   │       │   ├── [id]/route.ts      # GET, PATCH, DELETE single
│   │       │   └── [id]/verify/route.ts  # POST trigger verification
│   │       ├── verify/
│   │       │   └── route.ts           # POST C2PA verification
│   │       ├── upload/
│   │       │   └── route.ts           # POST presigned URL
│   │       ├── payment/
│   │       │   ├── checkout/route.ts  # POST create checkout
│   │       │   └── webhook/route.ts   # POST Stripe/Toss webhook
│   │       ├── search/
│   │       │   └── route.ts           # GET search
│   │       └── user/
│   │           ├── route.ts           # GET/PATCH profile
│   │           └── earnings/route.ts  # GET earnings
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx        # Global header
│   │   │   ├── footer.tsx        # Global footer
│   │   │   ├── sidebar.tsx       # Dashboard sidebar
│   │   │   └── mobile-nav.tsx    # Mobile navigation
│   │   │
│   │   ├── content/
│   │   │   ├── content-card.tsx        # Content preview card
│   │   │   ├── content-grid.tsx        # Grid layout for cards
│   │   │   ├── content-detail.tsx      # Full content view
│   │   │   ├── content-uploader.tsx    # Upload form + drag & drop
│   │   │   ├── verification-badge.tsx  # Verified/Pending/Unverified
│   │   │   └── price-tag.tsx           # Price display
│   │   │
│   │   ├── verification/
│   │   │   ├── verify-status.tsx       # Verification progress
│   │   │   ├── c2pa-details.tsx        # C2PA metadata display
│   │   │   └── provenance-chain.tsx    # Visual provenance timeline
│   │   │
│   │   ├── payment/
│   │   │   ├── checkout-modal.tsx      # Purchase flow
│   │   │   ├── price-selector.tsx      # License type selection
│   │   │   └── earnings-chart.tsx      # Revenue visualization
│   │   │
│   │   ├── search/
│   │   │   ├── search-bar.tsx          # Global search
│   │   │   ├── filter-panel.tsx        # Category/price/date filters
│   │   │   └── sort-selector.tsx       # Sort options
│   │   │
│   │   └── landing/
│   │       ├── hero.tsx                # Landing hero section
│   │       ├── features.tsx            # Feature showcase
│   │       ├── how-it-works.tsx        # Step-by-step flow
│   │       ├── pricing.tsx             # Commission structure
│   │       ├── testimonials.tsx        # Social proof
│   │       └── cta.tsx                 # Call to action
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Supabase client
│   │   │   ├── server.ts         # Server Supabase client
│   │   │   ├── admin.ts          # Service role client (webhooks)
│   │   │   └── middleware.ts     # Auth middleware helper
│   │   │
│   │   ├── c2pa/
│   │   │   ├── verify.ts         # C2PA verification logic
│   │   │   ├── extract.ts        # Metadata extraction
│   │   │   ├── hash.ts           # SHA-256 fingerprinting
│   │   │   └── types.ts          # Verification result types
│   │   │
│   │   ├── payment/
│   │   │   ├── stripe.ts         # Stripe client + helpers
│   │   │   ├── toss.ts           # Toss Payments helpers
│   │   │   └── commission.ts     # Commission calculation
│   │   │
│   │   ├── utils/
│   │   │   ├── format.ts         # Date, currency formatting
│   │   │   ├── image.ts          # Image processing helpers
│   │   │   └── validation.ts     # Zod schemas
│   │   │
│   │   └── constants.ts          # App-wide constants
│   │
│   ├── hooks/
│   │   ├── use-auth.ts           # Authentication hook
│   │   ├── use-upload.ts         # File upload with progress
│   │   ├── use-search.ts         # Debounced search
│   │   └── use-realtime.ts       # Supabase realtime subscription
│   │
│   ├── store/
│   │   ├── auth-store.ts         # Auth state (Zustand)
│   │   ├── cart-store.ts         # Cart/checkout state
│   │   └── ui-store.ts           # UI state (modals, theme)
│   │
│   └── types/
│       ├── database.ts           # Auto-generated Supabase types
│       ├── content.ts            # Content-related types
│       ├── user.ts               # User-related types
│       ├── payment.ts            # Payment-related types
│       └── verification.ts       # Verification-related types
│
├── supabase/
│   ├── config.toml               # Supabase local config
│   ├── seed.sql                  # Seed data for development
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_functions.sql
│       └── 004_indexes.sql
│
└── scripts/
    ├── generate-types.sh         # Supabase type generation
    └── seed-dev.ts               # Development seed script
```

---

## 4. DATABASE SCHEMA

### ERD Overview
```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  users   │───<│   contents   │───<│  purchases   │
└──────────┘    └──────────────┘    └──────────────┘
                       │
                       │
                ┌──────────────┐
                │ verifications│
                └──────────────┘
```

### Tables

#### `profiles` (extends Supabase auth.users)
```sql
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        VARCHAR(50) UNIQUE NOT NULL,
  display_name    VARCHAR(100),
  avatar_url      TEXT,
  bio             TEXT,
  role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  is_verified     BOOLEAN DEFAULT false,
  
  -- Seller-specific
  seller_tier     VARCHAR(20) DEFAULT 'basic' CHECK (seller_tier IN ('basic', 'pro', 'premium')),
  commission_rate DECIMAL(4,2) DEFAULT 20.00,  -- percentage
  
  -- Payment
  stripe_account_id    VARCHAR(255),  -- Stripe Connect account
  toss_seller_id       VARCHAR(255),  -- Toss seller account
  
  -- Stats (denormalized for performance)
  total_uploads   INTEGER DEFAULT 0,
  total_sales     INTEGER DEFAULT 0,
  total_earnings  DECIMAL(12,2) DEFAULT 0.00,
  
  -- Metadata
  country         VARCHAR(2),         -- ISO country code
  language        VARCHAR(5) DEFAULT 'en',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `contents`
```sql
CREATE TABLE public.contents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  slug            VARCHAR(255) UNIQUE NOT NULL,
  
  -- Content Type
  content_type    VARCHAR(20) NOT NULL CHECK (content_type IN ('photo', 'video', 'document', 'audio')),
  
  -- Files
  original_url    TEXT NOT NULL,       -- Original file (Supabase Storage)
  preview_url     TEXT,                -- Watermarked preview
  thumbnail_url   TEXT,                -- Thumbnail for cards
  file_size       BIGINT,             -- bytes
  file_format     VARCHAR(20),        -- jpg, png, mp4, pdf, etc.
  dimensions      JSONB,              -- { width: 4000, height: 3000 }
  duration        INTEGER,            -- seconds (video/audio)
  
  -- Pricing
  price           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  license_type    VARCHAR(20) DEFAULT 'standard' CHECK (license_type IN ('personal', 'standard', 'extended', 'exclusive')),
  
  -- Verification
  verification_status  VARCHAR(20) DEFAULT 'pending' 
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'unverifiable')),
  verification_id      UUID REFERENCES public.verifications(id),
  
  -- Discovery
  tags            TEXT[] DEFAULT '{}',
  category        VARCHAR(50),
  
  -- Stats
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,
  like_count      INTEGER DEFAULT 0,
  
  -- Status
  status          VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'removed')),
  is_featured     BOOLEAN DEFAULT false,
  
  -- SEO
  meta_title      VARCHAR(255),
  meta_description VARCHAR(500),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `verifications`
```sql
CREATE TABLE public.verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  
  -- C2PA Data
  has_c2pa        BOOLEAN DEFAULT false,
  c2pa_manifest   JSONB,              -- Full C2PA manifest data
  c2pa_issuer     VARCHAR(255),       -- Certificate issuer
  c2pa_timestamp  TIMESTAMPTZ,        -- Original creation timestamp
  
  -- Content Hash
  content_hash    VARCHAR(64) NOT NULL,  -- SHA-256 hash of original file
  perceptual_hash VARCHAR(64),           -- pHash for duplicate detection
  
  -- EXIF / Metadata
  exif_data       JSONB,              -- Camera, GPS, settings
  device_info     JSONB,              -- { make, model, software }
  capture_date    TIMESTAMPTZ,        -- From EXIF
  gps_location    JSONB,              -- { lat, lng, altitude }
  
  -- AI Detection
  ai_score        DECIMAL(5,4),       -- 0.0000 to 1.0000 (probability AI-generated)
  ai_detector     VARCHAR(50),        -- Which detector used
  ai_details      JSONB,              -- Detailed AI analysis results
  
  -- Verification Result
  overall_score   DECIMAL(5,4),       -- Combined authenticity score
  status          VARCHAR(20) DEFAULT 'processing'
    CHECK (status IN ('processing', 'verified', 'rejected', 'manual_review')),
  rejection_reason TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id),
  
  -- Provenance Chain
  provenance      JSONB,              -- Array of provenance events
  /*
    [
      { "action": "created", "device": "Canon EOS R5", "timestamp": "...", "software": null },
      { "action": "edited", "software": "Adobe Lightroom 7.1", "timestamp": "...", "changes": ["exposure", "crop"] },
      { "action": "uploaded", "platform": "Vericum", "timestamp": "..." }
    ]
  */
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `purchases`
```sql
CREATE TABLE public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES public.profiles(id),
  content_id      UUID NOT NULL REFERENCES public.contents(id),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Transaction
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  commission_amount DECIMAL(10,2) NOT NULL,  -- Vericum's cut
  seller_amount   DECIMAL(10,2) NOT NULL,    -- Seller receives
  
  -- License
  license_type    VARCHAR(20) NOT NULL,
  license_key     VARCHAR(100) UNIQUE NOT NULL,
  
  -- Payment
  payment_provider VARCHAR(20) CHECK (payment_provider IN ('stripe', 'toss')),
  payment_id       VARCHAR(255),      -- Stripe/Toss transaction ID
  payment_status   VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
  
  -- Download
  download_count   INTEGER DEFAULT 0,
  max_downloads    INTEGER DEFAULT 10,
  download_expires TIMESTAMPTZ,       -- NULL = no expiry
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `payouts`
```sql
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
```

#### `likes`
```sql
CREATE TABLE public.likes (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id)
);
```

#### `reports`
```sql
CREATE TABLE public.reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES public.profiles(id),
  content_id      UUID NOT NULL REFERENCES public.contents(id),
  reason          VARCHAR(50) NOT NULL CHECK (reason IN ('copyright', 'fake', 'inappropriate', 'spam', 'other')),
  description     TEXT,
  status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
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
```

### Row Level Security (RLS)
```sql
-- Profiles: users can read all, update own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles readable" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Contents: public read active, sellers manage own
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active content readable" ON public.contents
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers create content" ON public.contents
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers update own content" ON public.contents
  FOR UPDATE USING (seller_id = auth.uid());

-- Purchases: buyers see own, sellers see their sales
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own purchases" ON public.purchases
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Verifications: public read for verified content
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public verified content" ON public.verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contents c 
      WHERE c.verification_id = id AND (c.status = 'active' OR c.seller_id = auth.uid())
    )
  );
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### Auth Flow
```
User → Login Page → Supabase Auth → OAuth/Email → JWT → Session Cookie
                                                           │
                                                           ▼
                                                    Middleware checks
                                                    role & permissions
```

### Supported Providers
- Email + Password (primary)
- Google OAuth
- Apple OAuth (future)
- Kakao OAuth (Korean market)

### Role System
| Role | Permissions |
|------|------------|
| `user` | Browse, purchase, like, report |
| `seller` | All user + upload, manage content, view earnings |
| `admin` | All + manage users, review verifications, manage payouts |

### Middleware
```typescript
// src/middleware.ts
// Protected routes: /dashboard/*, /upload, /my-content, /earnings, /settings
// Seller-only routes: /upload, /my-content, /earnings
// Admin-only routes: /admin/*
```

---

## 6. API ROUTES

### Content APIs

#### `GET /api/content`
List contents with filters.
```typescript
Query Params:
  page: number (default: 1)
  limit: number (default: 20, max: 50)
  category: string
  type: 'photo' | 'video' | 'document' | 'audio'
  min_price: number
  max_price: number
  sort: 'newest' | 'popular' | 'price_asc' | 'price_desc'
  verified_only: boolean (default: true)

Response: {
  data: Content[],
  total: number,
  page: number,
  total_pages: number
}
```

#### `GET /api/content/[id]`
Get single content with verification details.
```typescript
Response: {
  content: Content,
  verification: Verification,
  seller: PublicProfile,
  related: Content[]  // Same category/tags
}
```

#### `POST /api/content`
Create new content (seller only, authenticated).
```typescript
Body: {
  title: string,
  description: string,
  content_type: 'photo' | 'video' | 'document' | 'audio',
  price: number,
  currency: 'USD' | 'KRW',
  license_type: 'personal' | 'standard' | 'extended' | 'exclusive',
  tags: string[],
  category: string,
  file_key: string  // Supabase Storage key from upload
}

Response: { content: Content, upload_url?: string }
```

### Verification APIs

#### `POST /api/verify`
Run C2PA verification on uploaded content.
```typescript
Body: {
  content_id: string,
  file_key: string  // Storage path
}

Response: {
  verification_id: string,
  status: 'processing' | 'verified' | 'rejected',
  has_c2pa: boolean,
  c2pa_data?: C2PAManifest,
  ai_score: number,
  overall_score: number,
  provenance: ProvenanceEvent[]
}
```

### Upload APIs

#### `POST /api/upload`
Get presigned upload URL.
```typescript
Body: {
  filename: string,
  content_type: string,  // MIME type
  file_size: number      // bytes
}

Response: {
  upload_url: string,     // Presigned URL
  file_key: string,       // Storage path
  expires_at: string
}
```

### Payment APIs

#### `POST /api/payment/checkout`
Create checkout session.
```typescript
Body: {
  content_id: string,
  license_type: 'personal' | 'standard' | 'extended' | 'exclusive',
  provider: 'stripe' | 'toss'
}

Response: {
  checkout_url: string,    // Redirect to payment page
  session_id: string
}
```

#### `POST /api/payment/webhook`
Handle payment provider webhooks.
```typescript
// Stripe: payment_intent.succeeded, payment_intent.failed
// Toss: DONE, CANCELED, FAILED
// Creates purchase record, updates seller earnings, sends confirmation email
```

### Search APIs

#### `GET /api/search`
Full-text search with filters.
```typescript
Query Params:
  q: string (search query)
  type: string
  category: string
  verified_only: boolean
  page: number
  limit: number

Response: {
  results: Content[],
  total: number,
  suggestions: string[]  // Related search terms
}
```

### User APIs

#### `GET /api/user`
Get current user profile.

#### `PATCH /api/user`
Update profile.

#### `GET /api/user/earnings`
Get earnings summary.
```typescript
Query: { period: 'day' | 'week' | 'month' | 'year' | 'all' }
Response: {
  total_earnings: number,
  pending_payout: number,
  last_payout: number,
  sales_count: number,
  chart_data: { date: string, amount: number }[]
}
```

---

## 7. C2PA VERIFICATION ENGINE

### Verification Flow
```
File Upload
    │
    ▼
[1] Extract Raw Metadata
    │  - EXIF data (camera, GPS, timestamp)
    │  - File format validation
    │  - Hash generation (SHA-256 + pHash)
    │
    ▼
[2] C2PA Manifest Check
    │  - Does file contain C2PA manifest?
    │  - Validate certificate chain
    │  - Extract provenance history
    │
    ▼
[3] AI Detection Score
    │  - Run AI-generated content detection
    │  - Score: 0.0 (human) → 1.0 (AI)
    │  - Multiple detector ensemble
    │
    ▼
[4] Duplicate Check
    │  - Compare perceptual hash against DB
    │  - Flag potential duplicates
    │
    ▼
[5] Composite Score
    │  - Weight: C2PA (40%) + EXIF (20%) + AI Score (30%) + Uniqueness (10%)
    │  - Threshold: >= 0.7 → Verified
    │  -            0.4 - 0.7 → Manual Review
    │  -            < 0.4 → Rejected
    │
    ▼
[6] Result → DB + Notification
```

### Verification Score Calculation
```typescript
// src/lib/c2pa/verify.ts

interface VerificationResult {
  overallScore: number;      // 0.0 - 1.0
  status: 'verified' | 'rejected' | 'manual_review';
  
  c2pa: {
    present: boolean;
    valid: boolean;
    issuer: string | null;
    timestamp: Date | null;
    manifest: object | null;
    score: number;           // 0 or 1
  };
  
  metadata: {
    hasExif: boolean;
    hasGPS: boolean;
    hasDevice: boolean;
    captureDate: Date | null;
    score: number;           // 0.0 - 1.0
  };
  
  aiDetection: {
    isAiGenerated: boolean;
    confidence: number;      // 0.0 - 1.0
    detector: string;
    score: number;           // 0.0 - 1.0 (inverted: 1 = human)
  };
  
  uniqueness: {
    isDuplicate: boolean;
    similarContentIds: string[];
    score: number;           // 0.0 - 1.0
  };
  
  provenance: ProvenanceEvent[];
}

function calculateOverallScore(result: VerificationResult): number {
  const weights = {
    c2pa: 0.40,
    metadata: 0.20,
    aiDetection: 0.30,
    uniqueness: 0.10
  };
  
  return (
    result.c2pa.score * weights.c2pa +
    result.metadata.score * weights.metadata +
    result.aiDetection.score * weights.aiDetection +
    result.uniqueness.score * weights.uniqueness
  );
}
```

### MVP AI Detection Strategy
For MVP, use heuristic-based detection:
1. **EXIF integrity check** — AI images often lack or have inconsistent EXIF
2. **Statistical analysis** — Check for GAN/diffusion artifacts
3. **C2PA presence** — Strongest signal of human origin

Post-MVP, integrate dedicated AI detection APIs (Hive, Optic, Illuminarty).

---

## 8. FILE UPLOAD & STORAGE

### Storage Structure (Supabase Storage)
```
vericum-content/
├── originals/           # Original files (private, download after purchase)
│   └── {user_id}/
│       └── {content_id}/
│           └── original.{ext}
├── previews/            # Watermarked previews (public)
│   └── {content_id}/
│       └── preview.{ext}
├── thumbnails/          # Card thumbnails (public)
│   └── {content_id}/
│       ├── thumb_sm.webp    # 300x200
│       ├── thumb_md.webp    # 600x400
│       └── thumb_lg.webp    # 1200x800
└── avatars/             # User profile images (public)
    └── {user_id}.webp
```

### Upload Flow
```
1. Client requests presigned URL → POST /api/upload
2. Client uploads directly to Supabase Storage (no server relay)
3. Client notifies server upload complete → POST /api/content
4. Server triggers:
   a. Thumbnail generation (Sharp)
   b. Watermarked preview generation
   c. C2PA verification pipeline
5. Content status: draft → pending_verification → active/rejected
```

### File Limits (MVP)
| Type | Max Size | Formats |
|------|---------|---------|
| Photo | 50 MB | JPG, PNG, WebP, TIFF, RAW (CR2, NEF, ARW) |
| Video | 500 MB | MP4, MOV, MKV |
| Document | 20 MB | PDF |
| Audio | 100 MB | WAV, MP3, FLAC |

---

## 9. PAYMENT SYSTEM

### Commission Structure
```
Buyer pays:     $100.00  (content price)
+ Buyer fee:    $  5.00  (5% buyer verification fee)
= Total charge: $105.00

Seller receives: $ 80.00  (80% of content price)
Vericum keeps:   $ 25.00  (20% commission + 5% buyer fee)
```

### Stripe Connect Flow (Global)
```
1. Seller onboarding → Stripe Connect Express account
2. Buyer checkout → Stripe Checkout Session
3. Payment → Stripe splits automatically:
   - 80% → Seller's Connect account
   - 20% → Vericum platform account
4. Webhook confirms → Create purchase record
5. Seller can withdraw from Stripe Dashboard
```

### Toss Payments Flow (Korean Market)
```
1. Seller registers → Toss seller verification
2. Buyer checkout → Toss Payment widget
3. Payment → Vericum receives full amount
4. Monthly payout → Calculate seller earnings, batch transfer
```

### License Types & Pricing Multiplier
| License | Use Case | Price Multiplier |
|---------|---------|-----------------|
| Personal | Personal, non-commercial | 1.0x |
| Standard | Commercial, single project | 2.0x |
| Extended | Commercial, unlimited projects | 5.0x |
| Exclusive | Full rights transfer | 10.0x+ (negotiable) |

---

## 10. SEARCH & DISCOVERY

### Full-Text Search (PostgreSQL)
```sql
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
```

### Categories (MVP)
```typescript
const CATEGORIES = [
  'photojournalism',      // 보도 사진
  'nature-wildlife',      // 자연/야생
  'street-urban',         // 거리/도시
  'portrait',             // 인물
  'event-documentary',    // 이벤트/다큐
  'aerial-drone',         // 항공/드론
  'food-lifestyle',       // 음식/라이프스타일
  'architecture',         // 건축
  'sports',               // 스포츠
  'other'                 // 기타
] as const;
```

---

## 11. FRONTEND PAGES & COMPONENTS

### Page Map
```
/                           → Landing page (서비스 소개, CTA)
/explore                    → Content marketplace browse
/explore?type=photo         → Filtered browse
/content/{id}               → Content detail + purchase
/search?q={query}           → Search results
/upload                     → Upload content (seller)
/login                      → Login/Register
/register                   → Register
/dashboard                  → User dashboard overview
/my-content                 → Seller's content management
/purchases                  → Buyer's purchase history
/earnings                   → Seller earnings dashboard
/settings                   → Account settings
/blog                       → Blog index
/blog/{slug}                → Blog post
/terms                      → Terms of service
/privacy                    → Privacy policy
```

### Key Component Specs

#### ContentCard
```typescript
interface ContentCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  price: number;
  currency: 'USD' | 'KRW';
  contentType: 'photo' | 'video' | 'document' | 'audio';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  sellerName: string;
  sellerAvatar: string;
  likeCount: number;
  isLiked: boolean;
}
// Displays: thumbnail, verification badge, price, seller info, like button
// Click → /content/{id}
```

#### VerificationBadge
```typescript
interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'rejected' | 'unverifiable';
  size: 'sm' | 'md' | 'lg';
  showLabel: boolean;
}
// Colors from brand guidelines:
// verified → Emerald (#10B981)
// pending → Amber (#F59E0B)  
// rejected → Coral (#EF4444)
```

#### ContentUploader
```typescript
// Drag & drop zone
// File type validation
// Upload progress bar
// Auto-triggers verification after upload
// Shows verification progress in real-time (Supabase Realtime)
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.local

# App
NEXT_PUBLIC_APP_URL=https://vericum.com
NEXT_PUBLIC_APP_NAME=Vericum

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Toss Payments
TOSS_SECRET_KEY=test_sk_xxxx
TOSS_CLIENT_KEY=test_ck_xxxx

# Resend (Email)
RESEND_API_KEY=re_xxxx
EMAIL_FROM=noreply@vericum.com

# Sentry
SENTRY_DSN=https://xxxx@sentry.io/xxxx

# Feature Flags
NEXT_PUBLIC_ENABLE_TOSS=true
NEXT_PUBLIC_ENABLE_AI_DETECTION=false  # Enable post-MVP
```

---

## 13. DEPLOYMENT

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

### Domain Setup (vericum.com)
```
# In domain registrar (Gabia/Cafe24):
# Add DNS records:
#   A record:     @ → 76.76.21.21
#   CNAME record: www → cname.vercel-dns.com
```

### Supabase Setup
```bash
# Install Supabase CLI
npm i -g supabase

# Init local project
supabase init

# Link to remote
supabase link --project-ref xxxxx

# Push migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --linked > src/types/database.ts
```

---

## 14. MVP SCOPE DEFINITION

### MVP (v1.0) — INCLUDED
- [x] Landing page
- [x] User auth (email + Google)
- [x] Content upload (photo only)
- [x] Basic C2PA verification (EXIF + hash + C2PA manifest check)
- [x] Content browsing + search
- [x] Content detail page with verification info
- [x] Stripe checkout (USD only)
- [x] Basic seller dashboard (uploads, earnings)
- [x] Buyer purchase + download
- [x] Responsive design (mobile + desktop)
- [x] Blog (3-5 launch posts)

### POST-MVP (v1.1+) — EXCLUDED FROM BUILD
- [ ] Video/audio/document support
- [ ] Toss Payments (Korean market)
- [ ] Advanced AI detection (Hive API)
- [ ] Kakao/Apple OAuth
- [ ] Seller tiers (Pro, Premium)
- [ ] Exclusive license negotiation
- [ ] Content collections/albums
- [ ] Follow sellers
- [ ] Notifications (email + in-app)
- [ ] Admin dashboard
- [ ] Analytics dashboard
- [ ] Multi-language (i18n)
- [ ] API for third-party integration

---

## BUILD INSTRUCTIONS FOR CLAUDE CODE

```bash
# 1. Initialize project
npx create-next-app@latest vericum --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
cd vericum
npm install @supabase/supabase-js @supabase/ssr zustand zod react-hook-form
npm install @stripe/stripe-js stripe sharp exif-parser
npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge
npm install resend
npm install -D @types/node supabase

# 3. Setup shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input card dialog badge avatar skeleton toast dropdown-menu

# 4. Read this spec and build in order:
#    a. Configure tailwind.config.ts with brand tokens
#    b. Setup Supabase (migrations, RLS, types)
#    c. Build auth flow
#    d. Build content upload + verification
#    e. Build marketplace browse + search
#    f. Build purchase flow
#    g. Build dashboard
#    h. Build landing page
#    i. Deploy to Vercel
```

---

*This document is the single source of truth for Vericum MVP development.*
*Last updated: 2026-02-12*
