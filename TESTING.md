# TESTING.md — testing patterns and gaps

> The repo has 1665 lines of pure-logic tests across two files. No e2e, no integration. This document describes the contract.

---

## Current tests

### `tests/security.test.mjs` (605 lines)

Covers `src/lib/security/redirect.ts`, `src/lib/security/sanitize.ts`, and the email-related sanitisation helpers in `src/app/api/email/route.ts`.

24 sections, all pure-logic:
- `sanitizeRedirect` — open redirect, protocol smuggling, encoded payloads, mixed-case schemes
- `escapeHtml` — XSS via `<script>`, `<svg onload=…>`, `<iframe src=javascript:…>`, body onload
- `sanitizeUrl` — javascript:, data:, mailto:, ftp:, file: schemes
- Cookie theft vectors
- SVG injection inside attribute values

### `tests/c2pa-verification.test.mjs` (1060 lines)

Covers `src/lib/c2pa/*`:
- `generateHashes` — SHA-256 stability across buffer sizes
- `checkDuplicateHash` — query shape, edge cases
- `scoreMetadata` — EXIF / GPS / device / capture-date weighting
- `scoreAIDetection` — AI software keyword detection, dimension flagging, JPEG quantization, prompt-in-metadata, entropy
- Commission math — premium and royalty sale types, buyer fee composition, license multipliers
- Provenance event building

Both files **reimport function bodies inline** (no `import` from `src/`) so they don't break on TS compilation issues. Trade-off: they verify the algorithm, not the actual exported code. A refactor in `src/lib/c2pa/verify.ts` can pass these tests while breaking the route.

---

## How to run

```bash
node --experimental-vm-modules tests/security.test.mjs
node --experimental-vm-modules tests/c2pa-verification.test.mjs
```

No `npm test` script is configured. Add to `package.json`:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules tests/security.test.mjs && node --experimental-vm-modules tests/c2pa-verification.test.mjs"
  }
}
```

(Phase 5 production-hardening item; also wire into CI.)

---

## Naming convention for new tests

- File: `tests/<scope>.test.mjs` (e.g. `tests/payment.test.mjs`, `tests/auth.test.mjs`)
- Section header: `## <Function or behaviour under test>`
- Each case: `// <case description>` followed by an assertion. Use the same `assert.deepStrictEqual` / `assert.strictEqual` style as the existing files.
- No external test runner. Tests run with plain `node`.

---

## What is missing

These gaps are real risks. List ordered by severity.

1. **No payment-flow e2e.** The `client_reference_id` bug fixed in Phase 1 would have been caught by an integration test that creates a Stripe test session, completes it, and asserts the `purchases` row gets created. Highest priority next test.

2. **No auth-flow integration.** Signup → email confirmation → login → role upgrade is entirely untested. The `isSeller: !!user` bug + the silent failure of `update({ role: "seller" })` both stem from this gap.

3. **No verification-pipeline integration.** `verifyContent` is unit-tested but `api/verify/route.ts` (which downloads from storage, calls `verifyContent`, inserts into DB, updates content row) is end-to-end untested. The `content_hash: ""` bug fixed in Phase 1 would have been caught.

4. **No RLS test.** Migrations 007/008 added column-level GRANTs and `FORCE ROW LEVEL SECURITY`. A regression here is silent and catastrophic. A small `tests/rls.test.mjs` that calls each table as an anonymous user, then as a different user, would catch policy drift.

5. **No type-regeneration check.** When a migration adds columns and `src/types/database.ts` isn't regenerated, the only signal is `(x as any)` casts piling up. A `tests/types-sync.test.mjs` that diffs the live schema against `database.ts` would catch this.

6. **No locale parity check.** The 10 locale JSON files in `src/messages/` drift independently. A `tests/i18n-parity.test.mjs` that asserts every key in `en.json` exists in every other file would catch it.

---

## "Run before commit" rules

When you change:

| File | Run |
|---|---|
| `src/lib/c2pa/*` | `tests/c2pa-verification.test.mjs` |
| `src/lib/security/*`, `src/app/api/email/route.ts` | `tests/security.test.mjs` |
| `src/lib/payment/commission.ts` | `tests/c2pa-verification.test.mjs` (has the commission cases) |
| `supabase/migrations/*` | Regenerate `src/types/database.ts`; document under MEMORY.md |

---

## Don't write tests for

- Pure data passthrough (route returns body unchanged)
- Tailwind class names
- Lucide icon imports
- Tests that mock the entire boundary they claim to test (they'll pass even when the real boundary breaks; this is exactly the trap the current pure-logic tests already fall into — don't replicate it on more layers)
