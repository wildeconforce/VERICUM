# MEMORY.md — accumulated findings

> Append-only log. Each entry: date, file:line, one-line note. Future passes add; never delete.
> Seeded from the audit at `VERICUM_AUDIT_2026-05-22.md`.

---

## 2026-05-22 — initial audit seed (12 findings)

1. **2026-05-22 — `src/hooks/use-auth.ts:82`** — `isSeller: !!user` treated every logged-in user as a seller. Fixed in Phase 1 to `profile?.role === "seller" || profile?.role === "admin"`. Single most impactful one-line fix in the codebase.

2. **2026-05-22 — `src/app/api/payment/checkout/route.ts:55-65`** — `createCheckoutSession` was not setting `client_reference_id`, so the webhook at `api/payment/webhook/route.ts:45` rejected every payment with "Missing buyer reference". Fixed in Phase 1 by adding `buyerId` to the session params (also added to `metadata.buyer_id` as belt-and-suspenders).

3. **2026-05-22 — `src/app/api/verify/route.ts:64`** — Verification row inserted with `content_hash: ""` (empty string), breaking duplicate detection. Fixed in Phase 1 by computing SHA-256 of the buffer at the route level (`createHash("sha256").update(buffer).digest("hex")`) and passing it into the insert.

4. **2026-05-22 — `src/app/(dashboard)/dashboard/page.tsx:111`** — Purchases count was hardcoded to `0`. Fixed in Phase 1 by adding a Supabase count query (`from("purchases").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).eq("payment_status", "completed")`).

5. **2026-05-22 — `src/app/page.tsx`** — 287 lines of inline landing duplicated the components in `src/components/landing/*` which were never imported. Fixed in Phase 1 by replacing the inline sections with `<HeroSection/>`, `<FeaturesSection/>`, `<HowItWorksSection/>`, `<SaleTypesSection/>`, `<PricingSection/>`. The CTA section remains inline because no CTA component exists yet (future cleanup).

6. **2026-05-22 — `src/types/database.ts`** — Missing `sale_type`, `royalty_rate` (added by migration 005) and the entire `bookmarks` table. Runtime code uses `(content as any).sale_type` as a workaround. Phase 2 task: regenerate types from live Supabase.

7. **2026-05-22 — `src/app/(auth)/login/page.tsx:18-60` and `register/page.tsx:18-60`** — 42-line `OAUTH_PROVIDERS` array duplicated verbatim. Phase 3 task: extract to `src/lib/auth/oauth-providers.tsx`.

8. **2026-05-22 — `src/app/api/content/[id]/route.ts:80-85`** — Response shape does not include `purchased: boolean` but `content/[id]/page.tsx:156` destructures it. The "Purchased" UI block at line 347 is unreachable. Phase 3 task: join `purchases` for the calling user and return the flag.

9. **2026-05-22 — `src/app/(dashboard)/settings/page.tsx:60-66`** — Client tries to `update({ role: "seller" })` directly on `profiles`. Migrations 007/008 block this via RLS. The toast says "Failed to upgrade account" with no diagnostic. Phase 3 task: add `/api/user/upgrade-seller` route.

10. **2026-05-22 — `src/app/api/locale/route.ts`** — Hard-codes 7 locales while `src/i18n/request.ts` has 10 and `language-selector.tsx` has 10. Three sources of truth. Phase 3 task: create `src/i18n/locales.ts` and import everywhere.

11. **2026-05-22 — `src/lib/security/rate-limit.ts:11`** — In-memory Map rate limiter; breaks on Vercel due to per-lambda isolation. Phase 5 task: replace with Upstash/Redis or `profiles.last_api_call` table-backed.

12. **2026-05-22 — `src/middleware.ts:9-12`** — Matcher does not exclude `/api/payment/webhook`, so Stripe webhook retries can be rate-limited and cause Stripe to give up. Phase 5 task: add bypass. Also: `/bookmarks` and `/downloads` are linked from the header but not in the protected route list — anonymous users hit a client component that 401s on the API call.

---

## 2026-05-22 — Phase 1 context kit drop

- Context kit created at repo root: `CLAUDE.md`, `AGENTS.md`, `MEMORY.md` (this file), `TESTING.md`, `GLOSSARY.md`, `MINDCHANGE.md`, `adr/0001-context-engineering-kit-adoption.md`.
- Sandbox blocked writes to `.claude/`, so the canonical location is repo root (matches Jack's template convention at `~/Desktop/12345678/repo/templates/`).
- The kit documents Jack's 4-layer authenticity vision (C2PA + forensic watermark + downstream match chain + auto royalty distribution on derivative monetization). Future agent passes must respect this vision when designing new features.

---

## 2026-05-22 — Migration 006 → 009 reversal (no ADR yet)

Migration `006_fix_profile_trigger.sql` defaulted `profiles.role = 'seller'` for new users; migration `009_fix_default_role.sql` reverted to `'user'`. Both files are still in the migration history. The git log knows; the codebase doesn't. Phase 2 task: write `adr/0002-default-role-user-not-seller.md`.

---

## 2026-05-22 — Commission flow walk-through (load-bearing)

`src/lib/payment/commission.ts:37` returns `commissionAmount = contentPrice * commissionRate + buyerFee`. The webhook does `sellerAmount = totalAmount - commissionAmount`. Walk-through: `contentPrice=10, buyerFee=1.5, totalCharge=11.5, commissionAmount=1.5+1.5=3, sellerAmount=11.5-3=8.5`. Seller receives 85% — correct by composition. Phase 2 task: write `adr/0003-commission-flow.md` so this is not lost.

---

> Add new entries below, newest at top.
