# Hermes Provenance Authoring Agent (Phase 1.5)

> **Status**: spec | **Window**: ~1 week build for Hermes Agent Challenge 2026-05-31 PDT | **Depends on**: Layer A (live) | **Feeds**: Layer B, Layer C

This spec describes the Hermes Agent integration that sits between the seller upload and the contents table. It is a Phase 1.5 piece. Layer A is the verification math. Layer B is the watermark. Hermes sits in the gap and turns the seller's raw upload into a fully declared C2PA manifest through a conversation, not a form.

Why this exists. A naive marketplace asks the seller to fill a checklist. The seller writes "shot with Sony A7 III" and forgets to mention they used Lightroom AI denoise. The C2PA manifest now omits an AI component. Six months later Layer C finds the same denoise signature in a downstream derivative and the marketplace cannot defend the provenance claim. Hermes asks the questions the seller would not have answered on their own.

## 1. Backend choice

Hermes ships seven backends. We pick Vercel Sandbox.

| Backend | Fit | Verdict |
|---|---|---|
| Vercel Sandbox | Same provider as the marketplace. Inherits the deploy pipeline. No extra account. Cold start under one second. | **chosen** |
| Modal | Strong for heavy compute. Overkill for a five-turn conversation. Adds an account. | runner-up if Vercel Sandbox quota becomes a problem |
| local | Works in development. Cannot reach the live marketplace from a seller's browser. | dev only |
| Docker / SSH | Self-managed infrastructure. Adds an ops surface this marketplace does not need yet. | skip |
| Singularity / Daytona | HPC and dev-environment focus. Wrong shape for a buyer-facing path. | skip |

Vercel Sandbox runs the Hermes session inside the same edge region as the Vericum API. The Hermes process reads from Supabase through the existing service-role key. Output writes return to the same Next.js API route that handles the rest of the upload pipeline. No extra hop. No extra auth boundary.

The decision becomes interesting if seller upload volume grows past a few hundred concurrent sessions. At that point Modal's cheaper per-session compute makes sense. The session protocol is identical so swapping the backend is a one-file change. Build for Vercel Sandbox. Migrate later if the numbers say so.

## 2. Interview prompt

The Hermes session runs from a system prompt plus five to seven turns. The conversation ends when every required C2PA field has a value or an explicit "not applicable".

### System prompt skeleton

```
You are the Vericum Provenance Agent. Your job is to walk a seller through the
authorship of a piece of content they have just uploaded. The output is a C2PA
manifest in JSON. Honesty is the goal. The seller may declare AI components or
human capture or a mix. Both are valid. Misrepresentation is the only failure.

Rules:
- Ask one question per turn.
- If the seller hesitates between AI and human capture, ask follow-ups about
  specific tools they touched.
- If EXIF metadata already names an AI software, surface it and ask the seller
  to confirm or correct.
- Never invent a tool, model, or workflow on the seller's behalf.
- End the session by reading back a short plain English summary and asking
  "is this accurate".
```

### Turn one

> "Quick question to start. Did you create this image yourself with a camera or did you generate or assist it with an AI tool?"

Branching from turn one drives the rest. The seller's answer routes into one of two flows.

### Human-capture flow (turns 2-5)

Turn 2: "What camera and lens. Just the model name is fine."
Turn 3: "Where and when. Rough is fine. City and date."
Turn 4: "Any editing software. Lightroom, Photoshop, Capture One, mobile apps. Even color presets count."
Turn 5: "Any AI-powered features inside that editor. Sky replacement, denoise, generative fill, content-aware crop. Honest is fine, it does not disqualify the listing."

### AI-assisted flow (turns 2-5)

Turn 2: "Which AI tool generated the base. Midjourney, Firefly, DALL-E, Stable Diffusion, custom model, other."
Turn 3: "Did you provide a reference image or only a text prompt. If reference, where did the reference come from."
Turn 4: "Any post-generation editing. Upscaling, inpainting, color correction, compositing."
Turn 5: "Any human-captured elements composited in. Real photo backgrounds, real product shots, real people."

### Termination

A final read-back turn shows the seller the assembled manifest in plain language. The seller can correct any field. A confirmed manifest writes to Supabase. A rejected manifest re-enters the interview at the contested field only, not from the start.

## 3. C2PA JSON output mapping

The conversation answers become specific manifest fields. The mapping is deterministic, not interpretive.

| Conversation field | C2PA manifest field | Notes |
|---|---|---|
| Camera + lens | `claim_generator_info[].name` and `device.model` | Only set if human-capture flow |
| Location + date | `assertion.exif.GPS*` and `assertion.exif.DateTimeOriginal` | If seller declines, leave null |
| Editing software | `actions[].action = "c2pa.edited"` plus `actions[].digitalSourceType` | One action per declared software |
| AI features inside editor | `ai_components[].component_type = "embedded_ai_feature"` plus tool name | Subset of editor declarations |
| Base AI tool | `ai_components[].component_type = "primary_generator"` plus model name | AI-assisted flow only |
| Reference image source | `ingredients[]` with role `inputTo` | Required when reference declared |
| Post-generation editing | `actions[].action = "c2pa.edited"` plus tool list | Append to actions |
| Composited human elements | `ingredients[].relationship = "componentOf"` | Required for hybrid pieces |

A top-level `transparency` field summarizes the disclosure:

- `fully_declared`: every reasonable question answered, no "I don't remember"
- `partially_declared`: at least one answer was "not sure" or "skip"
- `none`: seller declined the interview (manifest still writes the empty shell)

Vericum filters listings by `transparency` on the buyer search page. News and legal buyers can require `fully_declared` only. Marketing buyers can accept `partially_declared`.

## 4. Supabase trigger webhook

The seller upload flow already writes a row to `contents` with `status = 'pending_authoring'`. A Supabase database webhook fires on that insert. The webhook calls a Next.js route at `POST /api/hermes/session/start`.

```
POST /api/hermes/session/start
Authorization: Bearer <supabase service role>
Body: { content_id, seller_id, content_hash, exif_summary }

Response 202:
{
  session_id: <uuid>,
  websocket_url: "wss://...",
  expires_at: <iso>
}
```

The route boots a Hermes session inside Vercel Sandbox, hydrates it with the seller's prior memory (section 5), and returns a session id plus a websocket URL. The seller's browser connects to the websocket and the conversation begins.

Authentication. The Supabase webhook signs the payload with a shared HMAC secret stored in Vericum env. The Hermes route verifies the signature before booting anything. Replay protection is a UUID v7 nonce stored in a short-TTL table.

Retry. Webhook failure (= Hermes route returns 5xx) triggers Supabase's built-in retry with exponential backoff. Three retries max. After three failures the row sits in a `pending_authoring_failed` state and a service-role poll job recovers it every fifteen minutes.

Dead-letter. Repeated failure (more than ten attempts over a day) writes to `hermes_session_failures` for human review. The seller sees a polite "we are reaching out to assist with your listing" message instead of a stack trace.

## 5. Persistent memory

Hermes ships a memory store. The default is a local filesystem journal. That works for a single dev box. It does not work for Vercel Sandbox where each session may run on a different node.

We back the memory with Supabase. A new table `hermes_seller_memory` holds key-value pairs scoped to `seller_id`.

```
hermes_seller_memory (
  id              UUID PRIMARY KEY,
  seller_id       UUID REFERENCES profiles(id),
  memory_key      VARCHAR(64),
  memory_value    JSONB,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
)

UNIQUE (seller_id, memory_key)
```

The Hermes session loads all rows for `seller_id` at boot. The session writes new rows or updates existing ones at end-of-session, never mid-conversation.

Memory keys are structured. Example keys:

- `default_camera`: "Sony A7 III with 24-70 GM"
- `default_editor`: "Lightroom Classic, plus occasional Photoshop"
- `ai_tools_history`: array of tool names the seller has previously declared
- `transparency_pattern`: "fully_declared" or "partially_declared" trend

A repeat seller starts the interview with the agent saying "last time you mentioned Sony A7 III and Lightroom Classic. Same setup this time, or different." This compresses the conversation from five turns to two for a returning seller.

PII isolation. Memory is scoped by `seller_id` row by row. RLS on `hermes_seller_memory` allows the service role read and write. No other role gets any access. A seller's memory is never readable by another seller, by a buyer, or by an admin without a service-role escalation.

## 6. Error handling and seller review

Three classes of error matter.

### Hermes makes a wrong inference

The seller says "I did not use AI" and Hermes finds AI-software keywords in EXIF. Hermes does not silently override. It surfaces the conflict.

> "Just to double check. The file's metadata mentions Adobe Firefly. Was that involved at any step, even a small one?"

The seller can correct either side. If the seller insists no AI was used, Hermes records the discrepancy in a `provenance_dispute` field on the manifest. The buyer sees the dispute. The marketplace does not adjudicate.

### Session times out

A session expires after thirty minutes of inactivity. The contents row stays in `pending_authoring`. The seller can resume the session from the seller dashboard at any time. Hermes memory persists across resume cycles.

### Hermes itself errors

A Vercel Sandbox crash, a network blip, an LLM provider error. The session route returns a polite message to the seller and writes the partial state to `hermes_session_failures`. The seller dashboard offers a one-click retry. No silent data loss.

### Seller review before publish

The session ends with a read-back. The seller has a one-screen view of the assembled manifest in plain language. Two buttons. "Publish" writes to contents and triggers the C2PA verification engine (Layer A). "Edit field" reopens the specific question. The seller never sees raw JSON unless they want to.

## 7. Hermes Challenge Build track fit

The Hermes Challenge judges the Build track on whether the agent does real work at the heart of the project, not as a wrapper on top of an existing flow. This integration satisfies that test on three counts.

First, Hermes replaces a feature that would otherwise have to ship as a manual form. The seller would have filled out fifteen fields by hand. Hermes asks five questions through conversation. The difference is product-shaped, not demo-shaped.

Second, Hermes uses its own primitives. Persistent memory across sessions. Branching prompt flows. Tool use to read EXIF and cross-check. Subagent spawn would let one Hermes session author multiple uploads in parallel if a seller bulk-uploads a portfolio.

Third, the output of the Hermes session lands in the live marketplace schema. The contents row is real. The C2PA manifest is real. The buyer at vericum.com reads the result. There is no demo bucket and no toy database.

## Next Steps

The Phase 1.5 codebase additions:

- `src/lib/hermes/session.ts` = Hermes session boot, memory load, conversation orchestration
- `src/lib/hermes/manifest-mapper.ts` = conversation answer to C2PA field mapping (section 3)
- `src/lib/hermes/memory-store.ts` = Supabase-backed memory adapter for Hermes
- `src/app/api/hermes/session/start/route.ts` = Supabase webhook entry
- `src/app/api/hermes/session/[id]/route.ts` = websocket bridge per session
- `supabase/migrations/011_hermes_memory.sql` = `hermes_seller_memory` plus RLS
- `tests/hermes-session.test.mjs` = interview turn coverage, memory persistence, dispute handling

Submission deliverable for the Hermes Agent Challenge: a public dev.to post titled "Wiring Hermes Agent into a C2PA Marketplace Onboarding Flow" with the live URL of the running session demo at vericum.com.

Estimated build window: 5 to 7 working days. Demo recording: 1 day after build.
