<p align="center">
  <img src="public/logo.svg" alt="Vericum" width="80" height="80" />
</p>

<h1 align="center">Vericum</h1>

<p align="center">
  <strong>The first verified digital content marketplace built on C2PA + AI detection</strong>
</p>

<p align="center">
  Prove your content is real. Sell it with trust.
</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#vericum-trust-layer">Trust Layer</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## The Problem

AI-generated content is flooding the internet. Stock photo sites, news agencies, and content buyers have no reliable way to verify if an image is authentic. Existing solutions either:

- Only check C2PA metadata (easily stripped or faked)
- Only run AI detection (high false positive rates)
- Don't provide a marketplace to actually trade verified content

**Vericum solves all three.**

## How It Works

```
┌──────────────────────────────────────────────────────────┐
│                    Content Upload                         │
└──────────────────┬───────────────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  8-Step Pipeline   │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────────┐
│  C2PA  │  │   VTL    │  │  AI Ensemble │
│ 35%    │  │   30%    │  │     15%      │
└────────┘  └──────────┘  └──────────────┘
    │              │              │
    └──────────────┼──────────────┘
                   │
         ┌─────────▼─────────┐
         │   Trust Score     │
         │   + Trust Tier    │
         └─────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
 Platinum      Gold/Silver     Manual
 (≥0.90)       (≥0.55)        Review
 Auto-list     Auto-list      Admin Queue
```

Every uploaded piece of content goes through an **8-step verification pipeline**:

1. **C2PA Manifest Validation** — certificate chain, issuer, signing timestamp
2. **EXIF & Metadata Analysis** — device info, GPS, capture date consistency
3. **AI Detection (Local)** — entropy analysis, quantization patterns, dimension checks
4. **AI Detection (External)** — Hive AI, Optic AI, Illuminarty ensemble
5. **Perceptual Hash Deduplication** — DCT-based pHash with Hamming distance
6. **Vericum Trust Layer (VTL)** — proprietary 4-layer verification engine
7. **Trust Score Calculation** — weighted fusion of all signals
8. **Audit Trail** — immutable verification log for every decision

## Vericum Trust Layer

VTL is what makes Vericum different. It's a proprietary verification engine that sits **on top of C2PA**, answering questions C2PA alone cannot:

| Sub-Layer | Weight | What It Checks |
|-----------|--------|----------------|
| **Temporal Integrity** | 15% | Timestamp consistency, future date detection, timezone correlation |
| **Device Fingerprint** | 20% | Known camera/phone DB, EXIF consistency, manufacturer verification |
| **Cross-Reference** | 25% | Multi-signal correlation, conflict detection between layers |
| **AI Ensemble** | 40% | Weighted fusion of local heuristics + 3 external AI detection APIs |

**Trust Tiers:**

| Tier | Score | Meaning |
|------|-------|---------|
| 🏆 Platinum | ≥ 0.90 | Maximum trust — all signals align |
| 🥇 Gold | ≥ 0.75 | High trust — strong provenance |
| 🥈 Silver | ≥ 0.55 | Moderate trust — some signals weak |
| 🥉 Bronze | ≥ 0.35 | Low trust — significant gaps |
| ⚠️ Untrusted | < 0.35 | Cannot verify authenticity |

Critical VTL flags (e.g. `temporal_anomaly`, `device_signature_mismatch`) can **override** a passing C2PA check and force content into manual review.

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, signup, OAuth
│   ├── (marketplace)/   # Explore, search, content pages, upload
│   ├── (dashboard)/     # Seller dashboard, earnings, settings
│   ├── (admin)/         # Admin panel, manual reviews, audit log
│   └── api/
│       ├── verify/      # 8-step verification pipeline
│       ├── admin/       # Admin APIs (reviews, stats, flags)
│       ├── email/       # Transactional email (Resend)
│       ├── stripe/      # Payments & webhooks
│       └── health/      # System health check
├── lib/
│   ├── c2pa/
│   │   ├── verify.ts        # Main verification orchestrator
│   │   ├── trust-layer.ts   # VTL engine (607 lines)
│   │   ├── ai-detectors.ts  # External AI API integrations
│   │   ├── phash.ts         # DCT perceptual hashing
│   │   └── hash.ts          # Content hashing + duplicate check
│   ├── supabase/            # DB client, middleware, RLS
│   └── stripe/              # Payment processing
├── components/
│   ├── admin/               # Admin dashboard components
│   ├── layout/              # Header, footer, sidebar
│   └── ui/                  # Shared UI (Radix + CVA)
├── messages/                # i18n translations (10 languages)
└── types/
    └── verification.ts      # Core type definitions
```

## Features

### Content Verification
- **C2PA manifest reading** via `c2pa-node` SDK
- **Perceptual hashing** (DCT-based pHash) for near-duplicate detection
- **Multi-API AI detection** — Hive, Optic, Illuminarty with graceful fallback
- **VTL engine** — 4-layer proprietary trust scoring
- **Immutable audit trail** for every verification decision

### Marketplace
- **Stripe Connect** payments with platform fees
- **Content licensing** — browse, preview, purchase verified content
- **Seller dashboard** — earnings, analytics, content management
- **Bookmarks & downloads** — buyer content library

### Admin
- **Manual review queue** for flagged content
- **Platform statistics** — verification counts, user metrics
- **Audit log viewer** — full verification history
- **User management** — role-based access control

### Platform
- **10 languages** — EN, KO, JA, ZH, ES, FR, DE, PT, AR, HI (next-intl)
- **Dark mode** — system-aware theme switching
- **Responsive design** — mobile-first with Tailwind CSS
- **Email notifications** — sale confirmations, verification results (Resend)
- **Row-Level Security** — Supabase RLS policies for all tables

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (OAuth + email) |
| Payments | Stripe Connect |
| Verification | c2pa-node + VTL engine |
| AI Detection | Hive AI, Optic AI, Illuminarty |
| Email | Resend |
| i18n | next-intl (10 locales) |
| UI | Tailwind CSS + Radix UI + Framer Motion |
| State | Zustand |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)
- Stripe account (test mode)

### Installation

```bash
git clone https://github.com/your-username/vericum.git
cd vericum
npm install --ignore-scripts  # c2pa-node has native deps
```

### Environment Variables

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key
STRIPE_SECRET_KEY=               # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe publishable key
STRIPE_WEBHOOK_SECRET=           # Stripe webhook signing secret
RESEND_API_KEY=                  # Resend API key
NEXT_PUBLIC_APP_URL=             # Your app URL (https://vericum.io)
```

**Optional (AI detection APIs):**
```env
HIVE_API_KEY=          # Hive AI moderation
OPTIC_API_KEY=         # Optic AI detection
ILLUMINARTY_API_KEY=   # Illuminarty AI detection
```

### Database Setup

```bash
# Using Supabase CLI
npx supabase db push

# Or run migrations manually
bash scripts/migrate.sh
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

The project includes `vercel.json` with:
- ICN1 region (Asia-optimized)
- 60s timeout for verification routes
- Security headers (CSP, HSTS, X-Frame-Options)

### Health Check

After deployment, verify all systems:

```
GET /api/health
```

Returns status of: database, C2PA SDK, email, Stripe, AI detectors.

## Roadmap

- [ ] Video content verification (C2PA for video)
- [ ] Blockchain anchoring for verification proofs
- [ ] Creator verification badges (KYC)
- [ ] API access for enterprise integrations
- [ ] Mobile app (React Native)
- [ ] Bulk upload for agencies
- [ ] Content analytics for sellers

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with conviction that authentic content deserves to be trusted, valued, and traded fairly.
</p>
