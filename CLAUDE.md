# CLAUDE.md — VERICUM project conventions

> Read this first. Every session. Every model.
> This file is the shared mental model that prevents drift between Claude / Sonnet / Opus / Gemini passes.
>
> Companion files at repo root: `AGENTS.md`, `MEMORY.md`, `TESTING.md`, `GLOSSARY.md`, `MINDCHANGE.md`, plus `adr/0001-*`.

---

## 1. Product spec (one paragraph)

VERICUM is an **AI-verified authentic content marketplace** — the first stock-content platform built around **proof-of-real** rather than proof-of-license. Sellers (photojournalists, documentary filmmakers, event photographers, citizen journalists) upload originals. The verification engine extracts C2PA manifests, EXIF, dimensional/entropy/quantization signals and AI-software keywords, then issues a confidence score. Verified content is listed for buyers (news agencies, legal firms, insurance companies, marketing agencies) who pay through Stripe Connect with a 15% platform commission and a 15% buyer verification fee. Premium sales lock full rights; Royalty sales discount the purchase 40% in exchange for a 5-10% derivative-use royalty back to the original seller. Brand: "In the age of infinite fakes, truth becomes the ultimate luxury." Domain: vericum.com. Pronunciation: **베리쿰 / VEH-ri-kum**.

---

## 2. Jack's layered authenticity vision (the moat)

The product is **not** "just C2PA verification." That is the floor. The roof is three additional layers that turn VERICUM into a content-rights graph rather than a one-shot certification stamp:

**Layer A — C2PA standard verification (table stakes).** Industry-recognised manifest read, EXIF + AI-detection composite score, displayed publicly on the listing.

**Layer B — Forensic invisible watermarking on each sold copy.** Every download receives a unique per-buyer steganographic watermark embedded into the file (perceptually invisible, robust against re-encoding, cropping, screenshotting). Think Netflix's per-stream forensic watermarks, applied to stock content. Nothing visible to the buyer changes; we know exactly which licensed copy ended up in any leaked sample.

**Layer C — Match / tracking chain across the open web.** Crawler + reverse-image-search pipeline that fingerprints sold content and looks for it downstream: news articles, social posts, AI training datasets, derivative artworks. The watermark from Layer B + perceptual hash from Layer A combine into a deterministic match.

**Layer D — Ongoing royalty distribution on second-order monetization.** When a buyer takes a sold image, modifies it, and resells / publishes / monetizes the derivative, the match chain (C) attributes that monetization event back to the original seller and the royalty engine (already wired via `royalty_rate` on the `contents` table + Stripe Connect) auto-distributes the agreed cut. This converts a one-time sale into a long-tail revenue stream — the layer competitors like Shutterstock structurally cannot offer.

**Frame it like this**: Netflix-style per-user forensic watermarks applied to a stock content marketplace, plus auto revenue-share on 2nd-order monetization. C2PA is the ticket to the dance, the watermark-track-royalty triangle is why people stay.

Implementation status today: **Layer A live**, B/C/D **not yet built**. Schema already supports it (`royalty_rate`, `sale_type='royalty'`, `payment_provider`); engine doesn't. Treat any work touching `verifications`, `purchases`, `royalty_rate`, or the c2pa pipeline as ground-floor work for the full stack.

---

## 3. Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict)
- **DB**: Supabase Postgres with **9 migrations** (`supabase/migrations/001..009`). RLS enforced on every table. Migrations 007 + 008 are reference-quality security hardening — do not modify; only add 010+.
- **Auth**: Supabase Auth (email/password + OAuth: Google, GitHub, LinkedIn, Kakao)
- **Payments**: Stripe Connect Express (seller payouts), Toss Payments stub for KR (post-MVP)
- **Verification**: `c2pa-js` / `c2pa-node` (lazy-loaded; falls back to JUMBF marker detection)
- **i18n**: `next-intl`, 10 locales (en, ko, es, fr, ja, zh, de, ar, pt, hi)
- **UI**: shadcn/ui + Tailwind v4 + Framer Motion (`src/components/landing/*` use Framer)
- **State**: Zustand (`src/store/auth-store.ts`)
- **Testing**: `node --experimental-vm-modules tests/*.test.mjs` (no Jest)

---

## 4. Known failure patterns this repo has produced

When the audit ran (2026-05-22) every one of these was live in main. Do not reintroduce them.

1. **Inline-vs-component duplication.** `src/app/page.tsx` was 287 lines reimplementing what already existed in `src/components/landing/*`. Phase 1 swapped to the components — keep using them. **Rule: if you copy more than 30 lines, extract first.**

2. **OAuth config copy-paste.** `(auth)/login/page.tsx` and `(auth)/register/page.tsx` shipped identical 42-line `OAUTH_PROVIDERS` arrays. **Rule: any list with 3+ items used in 2+ files lives in `src/lib/`, imported.**

3. **3-place locale drift.** Locale set was defined in `src/i18n/request.ts` (10), `src/app/api/locale/route.ts` (7), and `src/components/layout/language-selector.tsx` (10). **Rule: single source = `src/i18n/locales.ts` (to be created). Every consumer imports from there.**

4. **`isSeller: !!user` misuse.** Treated every logged-in user as a seller. Fixed Phase 1 to `profile?.role === "seller" || profile?.role === "admin"`. **Rule: role checks live next to the role data, not next to the auth check.**

5. **Missing `client_reference_id` on Stripe sessions.** Webhook (`api/payment/webhook/route.ts:45`) reads `session.client_reference_id` but `createCheckoutSession` never set it. Result: every payment was rejected. Fixed Phase 1. **Rule: when you add or modify a Stripe checkout call, you also re-read the webhook handler.**

6. **Empty `content_hash` insert.** `api/verify/route.ts` inserted `content_hash: ""` so duplicate detection silently failed. Fixed Phase 1 by computing SHA-256 in the route. **Rule: every NOT NULL VARCHAR with a hash-shape name (`*_hash`, `*_id`, `*_key`) must be computed at insert time, not at "// will set later".**

7. **Schema drift on TS types.** Migrations 005 added `sale_type`, `royalty_rate`, `bookmarks`. `src/types/database.ts` was never updated, so production code uses `(content as any).sale_type`. **Rule: after every migration, regenerate `src/types/database.ts`. Phase 2 (separate pass) cleans this.**

8. **Internal HTTP hop between API routes.** `api/content/[id]/verify/route.ts` does `fetch("/api/verify", …)` instead of importing the function. **Rule: API routes call lib functions, never other API routes. If a behaviour is shared, extract to `src/lib/`.**

9. **Migration intent reversal.** Migration 006 defaulted `profiles.role = 'seller'`; migration 009 reverted to `'user'`. No ADR. **Rule: when a later migration undoes an earlier one, add an ADR. See `adr/0002-default-role-user-not-seller.md` (to be written).**

10. **Three layout regimes wrapping different headers / footers.** Landing, marketplace, dashboard each wrap their own Header. The `useAuth` hook fires per page load. **Rule: keep the per-route-group layouts but never add a fourth — and never wrap Header inside a page that lives under one of the existing layouts.**

---

## 5. "If you change X, also check Y" rules

| Change | Also check |
|---|---|
| `src/app/api/payment/checkout/route.ts` | `src/app/api/payment/webhook/route.ts` (same session shape), `src/lib/payment/stripe.ts` (signature), `src/lib/payment/commission.ts` (math invariant) |
| `src/lib/payment/commission.ts` | `tests/c2pa-verification.test.mjs` (commission math tests), `src/app/api/payment/webhook/route.ts` (`sellerAmount = totalAmount - commissionAmount` walk-through) |
| `supabase/migrations/*.sql` (new migration) | `src/types/database.ts` (regenerate), `MEMORY.md` (log the schema change), maybe an `adr/` entry if the migration reverses a prior decision |
| `src/hooks/use-auth.ts` | `src/lib/supabase/middleware.ts` (seller route gate must match), `src/components/layout/header.tsx` (uses `isSeller`), `src/app/(dashboard)/dashboard/page.tsx` (uses `isSeller`), `src/app/(dashboard)/settings/page.tsx` (role upgrade flow) |
| `src/lib/c2pa/verify.ts` | `tests/c2pa-verification.test.mjs` (algorithm coverage), `src/types/verification.ts` (`VerificationResult` shape), `src/app/api/verify/route.ts` (consumer), and ensure `content_hash` continues to be computed at the call site |
| `src/i18n/request.ts` locale list | `src/components/layout/language-selector.tsx`, `src/app/api/locale/route.ts`, the `messages/*.json` file set (must match cardinality) |
| `src/middleware.ts` matcher | Add `/bookmarks` + `/downloads` to protected list if you protect any new authenticated route. Stripe webhook path must be excluded from the rate limiter. |
| Any new client component | Check whether it should be a Server Component instead. Default to server unless it needs hooks. |
| Any new API route returning user-scoped data | Confirm RLS policies cover it; do not rely on the route alone. |

---

## 6. Conventions

- **Components**: PascalCase filenames in `src/components/`, kebab-case subfolders. Server Components by default; opt into `"use client"` only when needed.
- **Routes**: kebab-case folders under `src/app/`. Route groups in `(parens)` for layout sharing.
- **Hooks**: `use-*.ts` in `src/hooks/`.
- **Types**: domain types in `src/types/`. `database.ts` is the single source of truth and re-exported by the others.
- **Errors**: API routes return `{ error: string }` with HTTP code. Never leak internal error messages to the buyer or seller — log to `console.error` and return a generic string.
- **Money**: store integers of the smallest currency unit (cents/원) at the Stripe boundary; the rest of the schema uses `NUMERIC(10,2)`. Always multiply by 100 going into Stripe.
- **Time**: store as `TIMESTAMPTZ`, serialise as ISO 8601 UTC, display in user locale.
- **Naming**: `*_id` for foreign keys, `*_hash` for hashes, `*_at` for timestamps, `is_*` / `has_*` for booleans, `*_count` for tallies.

---

## 7. What this repo is good at (don't break)

- The migration suite (`supabase/migrations/001..009`) — particularly 007 + 008's RLS hardening
- `src/lib/c2pa/verify.ts` — the multi-signal AI detection heuristic
- `src/lib/supabase/middleware.ts` — rate limit + security headers + auth + role gating
- `tests/security.test.mjs` + `tests/c2pa-verification.test.mjs` — 1665 lines covering attack vectors and algorithm edges
- The route-group structure `(auth)`, `(marketplace)`, `(dashboard)`, `(legal)`

If you find yourself rewriting any of the above, you are off-script. Confirm with the user first.

---

## 8. File location note

The audit recommended placing this kit under `.claude/`. That directory is sandbox-protected by Claude Code on this machine, so the kit lives at repo root instead — which matches Jack's template convention at `~/Desktop/12345678/repo/templates/`. Future agent passes (Claude, Sonnet, Opus, Gemini, Codex) all read repo-root markdown by default.
