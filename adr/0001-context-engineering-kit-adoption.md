# 0001 — Adopt the 7-axis context engineering kit

* Status: Accepted
* Date: 2026-05-22
* Deciders: Jack An (founder), Claude Opus 4.7 (audit + implementation pass)

## Context and Problem Statement

VERICUM's first 38 commits were authored across at least four different model passes — Claude Sonnet, Gemini, Claude 4.5 Opus, and Claude Code (the harness). Each pass started cold. The 2026-05-22 audit identified ten concrete artefacts of this no-shared-context regime:

1. Two parallel landing implementations (`src/app/page.tsx` inline vs `src/components/landing/*`)
2. `isSeller: !!user` in `src/hooks/use-auth.ts:82` contradicting the seller-role gate in `src/lib/supabase/middleware.ts`
3. Migration `006_fix_profile_trigger.sql` defaulting `role='seller'` then migration `009_fix_default_role.sql` reverting to `'user'` with no rationale recorded
4. Locale list defined in three places with different lengths (`src/i18n/request.ts`=10, `src/app/api/locale/route.ts`=7, `src/components/layout/language-selector.tsx`=10)
5. OAuth provider list duplicated verbatim across `(auth)/login/page.tsx` and `(auth)/register/page.tsx`
6. `commissionAmount` semantics meaning two different things across `commission.ts` and `webhook/route.ts` — the math nets to seller-85% only by luck
7. `api/content/[id]/verify/route.ts` doing an internal HTTP hop instead of a function call
8. `src/types/database.ts` missing the `bookmarks` table and `sale_type`/`royalty_rate` columns added by migration 005
9. `/api/content/[id]` response shape missing `purchased: boolean` while the consumer destructures it
10. `.claude/` directory containing only `settings.local.json` — every session started cold

A single line of wrong code (`isSeller: !!user`) propagated into header, dashboard, settings, marketplace gating, and upload visibility. The Stripe `client_reference_id` omission silently broke 100% of purchases. The audit conclusion was unambiguous: the codebase has a competent second author (migrations 001-009, `src/lib/c2pa/verify.ts`, the test suites) but no shared mental model across sessions / models / commits.

## Decision Drivers

* Future maintenance will continue to use multiple model passes (it is faster and cheaper than locking to one)
* Audit findings show the same class of bugs recurring; without intervention they will recur again
* Time cost of context kit adoption ≈ 2-3 hours; estimated time cost of one more wrong-context bug ≈ ½ to 1 full day of debugging plus reputation damage if it ships to users
* Jack already maintains a template kit at `~/Desktop/12345678/repo/templates/` — adoption is a copy-and-tailor operation, not a from-scratch design

## Considered Options

1. **Do nothing.** Continue with `settings.local.json` only. Accept that every session is cold and every model produces an independent local optimum.
2. **Add CLAUDE.md only.** Single-file convention document. Cheaper but does not address task-output drift (which AGENTS.md targets) or terminology drift (GLOSSARY) or test-pattern drift (TESTING).
3. **Adopt the full 7-axis kit.** CLAUDE.md (conventions) + AGENTS.md (output schemas) + MEMORY.md (accumulated findings) + TESTING.md (test patterns) + GLOSSARY.md (vocabulary) + ADR (decisions) + MINDCHANGE.md (self-validation personality sequence).

## Decision Outcome

Chosen option: **3 — full 7-axis kit at repo root**.

Rationale: each axis targets a distinct failure mode observed in the audit. CLAUDE.md addresses items 1, 4, 5 (single-source rules); GLOSSARY.md targets item 2 (definition of "seller"); MEMORY.md captures every item; ADR (this file + future entries) captures items 3 and 6; AGENTS.md addresses items 7, 8, 9 (output-shape contracts); TESTING.md prevents future schema-drift / payment-flow / RLS regressions. MINDCHANGE.md is the meta-axis that sequences self-validation passes — Jack's own framework, no extra cost to drop in.

The kit lives at **repo root**, not `.claude/`. Two reasons:

1. The user's Claude Code harness on this machine sandbox-blocks writes to `.claude/`. Mandating `.claude/` as the canonical location would make the kit unmaintainable from inside the harness.
2. Jack's own template convention (`~/Desktop/12345678/repo/templates/`) puts these files at the project root. Repo-root markdown is also where every other model (Gemini, Codex, Cursor) looks by default — matching that convention maximises cross-tool consistency, which is the whole point.

### Positive Consequences

* Every new agent pass — Claude, Sonnet, Opus, Gemini — reads the same conventions before writing code
* Bug class "wrong mental model of `seller`" is permanently closed (GLOSSARY.md + CLAUDE.md §5 cross-references)
* Decision reversals (like migration 006→009) are now logged; future contributors don't re-derive
* The audit itself becomes a versioned reference; it is no longer "the doc from one Opus pass" but a seed for an ongoing MEMORY.md log

### Negative Consequences

* Six new files at the repo root, increasing visual noise
* Adds maintenance burden: stale context is worse than no context. Each axis must be updated when its truth changes
* MINDCHANGE.md is a heavier prompt-pattern document; using its 3-stage self-critique sequence will sometimes hit negative spirals (documented in the file itself) — that is a deliberate trade-off

## Implementation

* `CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, `TESTING.md`, `GLOSSARY.md`, `MINDCHANGE.md` written at repo root
* `adr/0001-context-engineering-kit-adoption.md` (this file) created
* `adr/0002-default-role-user-not-seller.md` and `adr/0003-commission-flow.md` flagged as Phase 2 tasks in MEMORY.md

## Links

* Source audit: `VERICUM_AUDIT_2026-05-22.md`
* Template repo: `~/Desktop/12345678/repo/templates/`
* MADR format: <https://adr.github.io/madr/>
