# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (Next.js)
npm run lint         # ESLint
node --experimental-vm-modules tests/security.test.mjs   # Run security tests
```

## Architecture

VERICUM is a C2PA-verified digital content marketplace built with Next.js 16 App Router + Supabase + Stripe.

### Route Groups
- `src/app/(auth)/` — Login, register, OAuth callback
- `src/app/(marketplace)/` — Browse, upload, search, content detail
- `src/app/(dashboard)/` — User dashboard, earnings, purchases, bookmarks, settings
- `src/app/(legal)/` — Terms, privacy
- `src/app/api/` — All API routes (content, verify, upload, payment, search, user)

### Supabase Client Pattern
Three distinct clients, each for a specific context:
- `lib/supabase/client.ts` — Browser client (singleton, patches `navigator.locks` to avoid deadlocks)
- `lib/supabase/server.ts` — Server Components/Route Handlers (uses `cookies()`)
- `lib/supabase/admin.ts` — Service role client for webhooks and admin operations

### Middleware (`src/middleware.ts` + `lib/supabase/middleware.ts`)
All requests pass through middleware that:
1. Rate-limits API routes (100 req/60s per IP)
2. Refreshes Supabase auth session
3. Redirects unauthenticated users from protected routes (`/dashboard`, `/upload`, `/settings`, etc.)
4. Redirects non-seller users from seller routes (`/upload`, `/my-content`, `/earnings`)
5. Applies security headers (HSTS, X-Frame-Options, CSP-adjacent)

### C2PA Verification Pipeline (`lib/c2pa/`)
Composite scoring: C2PA manifest (40%) + EXIF metadata (20%) + AI detection (30%) + uniqueness (10%).
Thresholds: ≥0.7 verified, 0.4–0.7 manual review, <0.4 rejected.

### State Management
Zustand stores in `src/store/`: auth-store, cart-store, ui-store.

### i18n
10 languages via next-intl. Translation files in `src/messages/`. Config in `src/i18n/request.ts`, plugin applied in `next.config.ts`.

## Key Conventions
- Path alias: `@/*` → `./src/*`
- Server Components by default; `"use client"` only when necessary
- Database migrations in `supabase/migrations/` (001–009)
- User roles: `user`, `seller`, `admin` — enforced via RLS + middleware
- Commission: seller gets 80%, platform takes 20% + 5% buyer fee
- Jack (founder) communicates in Korean casual style; deliverables should be production-ready
