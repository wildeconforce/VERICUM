# Phase 2: Watermark Engine Spec (Layer B)

**Status:** planned | **Window:** ~8 weeks | **Depends on:** Layer A (live) | **Feeds:** Layer C

This spec turns the dev.to promise into a build plan. We port `imWatermark` from Stable Diffusion's `invisible-watermark` library to a Node runtime so it runs inside a Next.js API route. The per-buyer salt is derived from `purchase.id`. Every sold copy carries a unique forensic mark. Nothing the buyer sees changes.

## 1. Algorithm: DWT-DCT-SVD

We use **DWT-DCT-SVD** (the `dwtDctSvd` method in `invisible-watermark`).

The embed runs a Haar wavelet transform. Then a block DCT. Then it writes the payload into the singular values of small blocks. Singular values barely move under JPEG recompression and resizing. That stability is the whole reason to pick it.

| Method | Robustness | Runtime cost | Verdict |
|---|---|---|---|
| dwtDct | low to medium | tiny | too fragile under recompression |
| **dwtDctSvd** | medium to high | small, pure numeric | **chosen** |
| RivaGAN | high | ONNX model plus heavy runtime | breaks the "fits in an API route" promise |
| StegaStamp | survives print and photo | TensorFlow plus a large model | heaviest. visible artifacts. overkill |

RivaGAN and StegaStamp need model weights of tens to hundreds of megabytes plus an inference runtime. A serverless API route has a cold-start budget and no GPU. dwtDctSvd is plain array math. It cold-starts in milliseconds with no model file.

Honest limit: a blind frequency-domain watermark is weak against heavy cropping and rotation. We accept that. Layer C closes the gap by pairing the watermark with the Layer A perceptual hash. If the watermark dies the perceptual hash still proves "this is content X".

## 2. Porting `invisible-watermark` to Node

The Python library leans on three native packages.

| Python dependency | Job | Node replacement |
|---|---|---|
| `numpy` | array math | `Float64Array` plus hand-written loops |
| `opencv-python` | image IO and block DCT | `sharp` for IO. hand-written DCT-II for blocks |
| `PyWavelets` | 2D Haar DWT | hand-written Haar transform (~30 lines) |
| `numpy.linalg.svd` | SVD on blocks | `ml-matrix` SVD or a fixed 4x4 Jacobi SVD |

`sharp` (libvips) handles decode, encode, resize and raw pixel access. It is a standard Next.js image dependency and ships a prebuilt binary. We do **not** use `node-canvas`. It needs a native Cairo build and it is a drawing API, not a transform API.

We do **not** shell out to Python. Vercel's Node runtime has no Python interpreter. A subprocess adds cold-start cost and packaging pain. The post promised a Node port. We ship a Node port.

One insight makes this tractable. We own both the embed and the detect side. We do not need to match the Python reference bit-for-bit. We only need our own embed and detect pair to agree. That kills the float32-versus-float64 worry and frees us to pick block sizes that are fast in JS.

The mark goes in the luminance channel. Convert RGB to YUV. Mark the Y plane. Convert back. Re-encode JPEG and WebP at quality 95 or higher so the encoder does not erase the mark. PNG is lossless and safest.

## 3. Per-buyer salt from `purchase.id`

`purchase.id` is a UUID and is unique per purchase. Deriving the mark from it means the same buyer's two purchases carry two different marks. That is exactly the requirement.

We use **HMAC-SHA256** with a server-side secret.

```
token_full = HMAC_SHA256(WATERMARK_HMAC_SECRET, "vericum-wm-v1:" + purchase.id)
payload    = first 64 bits of token_full
```

Why HMAC and not a plain hash. A plain `SHA256(purchase.id)` is reproducible by anyone who learns a purchase id. UUIDs leak through URLs and logs. HMAC with a server secret means only Vericum can mint or verify a token. A leaker who extracts the payload cannot reverse it to a purchase. An attacker cannot forge a token for a purchase they do not own.

Why not a hash chain. Chains encode order. We do not need order. We need independent collision-resistant tokens. HMAC is the right primitive and a chain is the wrong tool.

The `vericum-wm-v1:` prefix is a domain separator and a version tag. Rotating the scheme later just bumps it to `v2` and old marks still verify under the old key.

We store the full token hex on `purchases.watermark_token` with a unique index. Detection recovers the 64-bit payload and does an indexed lookup. That is O(1). 64 bits sits well below the birthday bound for our expected volume. If volume grows we widen the payload.

## 4. Embed endpoint: `POST /api/watermark`

Phase 1's `/api/verify` takes a JSON body and pulls the file from Supabase storage. It does not do multipart. We follow that pattern.

The buyer's file already sits in storage after purchase. Re-uploading it over multipart wastes bandwidth. So the request body is JSON:

```json
{ "purchase_id": "uuid" }
```

The route looks up the purchase. It confirms the caller is the buyer, the same ownership check `/api/verify` runs for sellers. It downloads the original, embeds the mark, writes the marked copy to a per-purchase storage key and returns a signed URL. Multipart stays only as a fallback for an internal re-watermark tool.

**When to embed.** Lazily, on first download. The marked file is cached in storage keyed by `purchase.id`. Later downloads serve the cache. Compute runs once per purchase.

**Sync or async.** A DWT-DCT-SVD pass on a normal photo runs in under a second to a few seconds. Large images can blow past a comfortable serverless response window.

- Images under a size threshold: synchronous. Result returned inline.
- Large images and any video: asynchronous. Return `202` with a job id. `watermark_status` tracks progress.
- Build sync first for the MVP. The response always carries a `watermark` object so the schema is async-ready from day one.
- Video watermarking is out of scope for the 8-week window.

Success response:

```json
{
  "purchase_id": "uuid",
  "watermark": {
    "status": "complete",
    "algorithm": "dwt-dct-svd-v1",
    "version": 1,
    "embedded_at": "2026-05-22T00:00:00Z"
  },
  "download_url": "https://...signed...",
  "download_expires": "2026-05-22T01:00:00Z"
}
```

We never return the token to the buyer. Errors follow the CLAUDE.md rule: `{ error: string }` plus an HTTP code and a generic message. Previews and thumbnails stay unmarked. The forensic mark goes on the licensed download only.

## 5. Detect endpoint: `POST /api/watermark/detect`

This one takes an upload. The suspect file comes from outside: the Layer C crawler, a manual report, a takedown check. It accepts multipart or `{ "image_url": "..." }`.

Detection is not exact-match. A recovered payload carries bit errors. The design is built around tolerance.

1. Decode the suspect image with `sharp`.
2. Normalize. The original dimensions are known from `contents.dimensions`. Resize the suspect back to the original scale and a few neighboring scales. Screenshots and resaves change resolution.
3. Scan offsets. The embed tiles the payload across the image in fixed blocks. A crop that keeps one whole tile still yields the payload. Detection sweeps several block offsets.
4. Run the extractor on each candidate. Compute the Hamming distance to every known `watermark_token`. Match on the nearest token inside a Hamming threshold, not on equality.
5. A best match above threshold returns `purchase_id` plus a confidence and a bit-error rate.

**Error correction.** The raw `dwtDctSvd` payload has no ECC. We wrap the 64-bit token in a BCH or Reed-Solomon code before embedding. The embedded payload grows to roughly 128 to 256 bits and tolerates real bit flips. This single change is what makes screenshot detection work.

**Two signals, not one.** Detect returns a content match (Layer A perceptual hash) and a buyer match (Layer B watermark) separately. Heavy editing can kill the watermark while the perceptual hash survives. The crawler still learns "this is content X" even when it cannot name the buyer.

**Access.** Detect is not public. A public detector lets an attacker tune removal attacks against their own file. It is admin and service-role only and rate-limited.

## 6. Strength versus visual quality

`dwtDctSvd` exposes an embed-strength constant. Higher strength survives more attacks and shows more artifacts. Banding appears first in flat regions like skies and studio backdrops.

We tune against numbers, not eyeballs.

- **Quality floor:** SSIM above 0.98 and PSNR above 40 dB. Below that a buyer can see the damage.
- **Robustness battery:** JPEG at quality 90 then 75 then 50. Resize to 50%. Crop at 10% and 25%. A screenshot simulation of resize plus recompress. Mild Gaussian noise. Track the bit-error rate per attack.

The product bias is clear. Vericum sells verified-real content to news agencies and legal teams. A buyer who pays a premium and gets a visibly degraded file is a brand failure. Quality wins ties.

We do not chase robustness with brute strength. We get it from redundancy. Tiling the payload plus the ECC from section 5 buys survival without raising per-block strength. A content-adaptive mask (stronger in busy texture, weaker in smooth sky) is a Phase 2.5 improvement and not MVP.

Ship one calibrated default. Tune it once against the battery on a sample set of real photojournalism images. Store the strength used per purchase so any later audit can reproduce the parameters.

## 7. Schema changes

A correction first. The per-buyer mark belongs to a **purchase**, not to a content row. One content sells many times and each sale gets its own mark. So the columns live mostly on `purchases`.

New migration: `supabase/migrations/010_watermark_engine.sql`. It follows the `ADD COLUMN IF NOT EXISTS` style of 005 and the RLS conventions of 007 and 008.

On `purchases`:

| Column | Type | Purpose |
|---|---|---|
| `watermark_token` | `VARCHAR(64)` | hex HMAC token, the embedded identifier. unique index |
| `watermark_status` | `VARCHAR(20)` | `pending` / `processing` / `complete` / `failed` |
| `watermark_algorithm` | `VARCHAR(30)` | e.g. `dwt-dct-svd-v1` |
| `watermark_version` | `SMALLINT` | scheme version for rotation |
| `watermark_strength` | `NUMERIC(4,3)` | strength used, needed for audit |
| `watermarked_file_key` | `TEXT` | storage path of the cached marked copy |
| `watermarked_at` | `TIMESTAMPTZ` | embed time |

On `contents`, one flag:

| Column | Type | Purpose |
|---|---|---|
| `watermark_enabled` | `BOOLEAN DEFAULT true` | whether sold copies of this content get the mark |

**RLS.** Migration 007 already blocks client `UPDATE` on `purchases`, so only the service role writes the watermark columns and no new write policy is needed. One catch. `watermark_token` is the forensic identifier. A buyer who can read it could try to locate and scrub it. We apply the column-level pattern from migration 008: `REVOKE` then `GRANT SELECT` of safe columns so even a `select('*')` cannot leak the token.

After the migration, regenerate `src/types/database.ts`. CLAUDE.md rule 7 and the "change X check Y" table both point at this.

**Forward note.** Layer C will want a `watermark_detections` table to log crawl hits. Out of scope for Phase 2. Named here so the migration numbering leaves room.
