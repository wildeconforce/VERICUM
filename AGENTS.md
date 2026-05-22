# AGENTS.md — output schemas for common VERICUM task types

> One page. One schema per task type. When the user asks for a task, the agent's output must match the schema below.

---

## 1. PR review

```
## Verdict
[approve | request changes | block]

## Summary (≤3 lines)
[what the PR does, in plain English]

## Findings (numbered)
1. [file:line] — [issue, ≤2 sentences]. **Severity:** low|med|high|blocker.
2. ...

## Required changes
- [bullet] [file:line] [exact fix]

## Optional improvements
- [bullet]

## Tests touched / needed
- [bullet]
```

Rule: every finding must reference `file:line`. Severity = blocker if it breaks a user-facing flow.

---

## 2. Bug fix

```
## Bug
[one sentence — what is broken from user POV]

## Root cause
[file:line] — [why it breaks]

## Fix
- Edited [file:line]: `[old → new]` (one-line each, batch related edits)

## Verification
- [ ] Manual test path: [steps]
- [ ] Automated test added/updated: [path]

## Related (also-check rule from CLAUDE.md §5 triggered: yes/no, if yes which)
```

Rule: smallest viable change. Don't refactor adjacent code in the same PR.

---

## 3. Refactor

```
## Refactor scope
[1 sentence]

## Before
[snippet or path summary]

## After
[snippet or path summary]

## Behaviour preserved
- [bullet 1] — by [test/assertion]
- [bullet 2] — by [test/assertion]

## Files moved/renamed
- [old path] → [new path]

## Imports updated
- [count] files
```

Rule: refactors must not change behaviour. If a refactor touches a payment/auth/verification path, list every call site you confirmed.

---

## 4. Schema change (new migration)

```
## Migration
`supabase/migrations/0XX_<slug>.sql`

## What changes
- [bullet, idempotent]

## Backward compatibility
[is existing code still safe? if not, list the upstream changes needed]

## TypeScript types
- [ ] Regenerated `src/types/database.ts` via `mcp__claude_ai_Supabase__generate_typescript_types`
- [ ] Removed any `(x as any)` casts this migration unlocks

## RLS impact
[which tables / policies; any new SECURITY DEFINER function justified?]

## Tests
- [ ] Migration runs cleanly against a branch project
- [ ] Existing tests still pass

## ADR
[link to adr/ if this reverses or supersedes an earlier decision]
```

Rule: every migration is idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS …`). No data deletions without explicit consent.

---

## 5. New API route

```
## Route
`[METHOD] /api/<path>`

## Auth
[Supabase session | admin secret | webhook signature | public]

## Inputs (request body / query)
- field: type — validation

## Outputs
```json
{ "field": "type" }
```

## Errors
- 400 [reason]
- 401 [reason]
- 403 [reason]
- 404 [reason]
- 500 [reason]

## RLS / authorization
[explain how the user can or can't see other users' data]

## Tests
- [ ] Happy path
- [ ] Unauthorised
- [ ] Bad input
```

Rule: never call another API route from an API route. Extract shared logic to `src/lib/`.

---

## 6. New page

```
## Page
`src/app/[group]/<slug>/page.tsx`

## Server or client?
[server (default) | client + reason]

## Data
- [bullet] — fetched from [endpoint or supabase query]

## Translations
- Keys added to `src/messages/en.json` under [namespace]
- Sync needed in [list of locale files] — yes/no

## Protected route?
- [ ] Listed in `src/lib/supabase/middleware.ts` protected array
- [ ] Listed in seller-only array if seller-only

## Layout
[which route group; confirm no nested Header/Footer]
```

Rule: every new authenticated page goes through middleware before client-side gating.
