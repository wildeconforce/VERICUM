# GLOSSARY.md — VERICUM domain vocabulary

> Single source of truth for terms that get used inconsistently across models / sessions / files.
> When a new term enters the codebase, add it here before pushing.

---

## Core authenticity terms

| English | Korean | Definition |
|---|---|---|
| **C2PA** | C2PA | Coalition for Content Provenance and Authenticity. An open standard (Adobe / Microsoft / BBC / Truepic backed) for cryptographically signed content metadata embedded directly in the file. The repo uses `c2pa-node` to read manifests; if unavailable, falls back to JUMBF marker detection. |
| **Manifest** | 매니페스트 | The structured payload inside a C2PA-signed file describing how it was created, which device, what edits were applied, by whom. Stored as JSONB in `verifications.c2pa_manifest`. |
| **Assertion** | 어서션 | A single claim inside a manifest (e.g. "this image was captured on this camera", "this edit was made by this software"). Manifests contain multiple assertions. |
| **Provenance** | 출처 / 프로보넌스 | The chain of custody of a piece of content from creation to current state. Modelled as `ProvenanceEvent[]` in `src/types/verification.ts`. |
| **EXIF** | EXIF | Exchangeable Image File Format. The metadata block in most camera-produced images. VERICUM reads EXIF for camera model, capture timestamp, GPS, software field — feeds into `scoreMetadata` and `scoreAIDetection`. |
| **AICA** | AICA | Not used in this codebase. (Listed in case a different stakeholder uses it for "AI-Content Attestation".) |
| **진본 (jinbon)** | 진본 | "True / authentic original." Jack's preferred Korean translation of the product concept ("진본 인증" = authenticity certification). Note: the current `messages/ko.json` uses **인증** (certification), not **진본** — that drift is logged in MEMORY.md item 12 and is a Phase 4 brand-decision task. |
| **인증 (injeung)** | 인증 | "Certification." Currently used in `messages/ko.json` (e.g. "인증된 콘텐츠 마켓플레이스"). Less brand-aligned than 진본; pending decision. |

---

## Marketplace roles

| English | Korean | Definition |
|---|---|---|
| **Seller** | 셀러 | A user with `profiles.role IN ('seller', 'admin')`. Can upload content, set price, receive payouts via Stripe Connect. The `isSeller` boolean in `useAuth` is true iff the profile role matches one of these two values (Phase 1 fix). |
| **Buyer** | 버이어 / 구매자 | Any authenticated user purchasing content. There is no `role='buyer'` — every authenticated user is implicitly a potential buyer. Use `profiles.role` checks for sellers; do not gate buyers behind a role. |
| **Admin** | 어드민 / 관리자 | A user with `profiles.role = 'admin'`. Can moderate reports (migration 007), bypasses the seller-only gate, sees all admin pages. |
| **User** | 유저 / 일반 사용자 | New users default to `role = 'user'` per migration 009. They can browse, bookmark, and purchase. To sell they must go through the (Phase 3) upgrade route. |

---

## Sale economics

| English | Korean | Definition |
|---|---|---|
| **Premium sale** | 프리미엄 판매 | `contents.sale_type = 'premium'`. Full price per license, no derivative royalty. The buyer's payment is the seller's last revenue event for that copy. |
| **Royalty sale** | 로열티 판매 | `contents.sale_type = 'royalty'`. 40% discount on the purchase price in exchange for a `royalty_rate` (5-10%) on downstream derivative monetization. Engine for the downstream payout = Layer D in CLAUDE.md §2 (not yet implemented). |
| **License type** | 라이선스 종류 | One of `personal`, `standard`, `extended`, `exclusive`. Controls the licensed use scope; multiplier is applied in `src/lib/payment/commission.ts`. |
| **Commission** | 수수료 | Platform's cut. Default = 15% of `content.price` (seller side) plus the buyer fee. See "Commission math" in MEMORY.md and (when written) `adr/0003-commission-flow.md`. |
| **Buyer fee** | 검증 수수료 | Verification fee charged on top of the listing price to the buyer. Default = 15% of `content.price`. Composed into `commission.commissionAmount` so the webhook math nets to seller-85%. |
| **Royalty / Revshare** | 로열티 / 수익분배 | Recurring payment to the original seller when a downstream buyer monetizes a derivative work. Schema-ready (`royalty_rate`, `purchases.amount`, Stripe Connect transfers), engine pending. |
| **Payout** | 페이아웃 / 정산 | A Stripe Connect transfer of accumulated seller earnings. Stored in `payouts`. Status flow: `pending → completed`. |

---

## Provenance / forensics layer (Jack's vision — Layers B/C/D)

| English | Korean | Definition |
|---|---|---|
| **Watermark** | 워터마크 | An invisible, file-embedded signal that survives common transformations (recompression, cropping, screenshotting). In VERICUM each sold copy gets a **per-buyer** watermark — the same source content downloaded by two buyers carries two different watermarks. Layer B. |
| **Fingerprint** | 지문 / 핑거프린트 | A perceptual hash of an image that matches even after lossy edits (resize, recolour, light crop). Different from SHA-256 (which only matches byte-identical files). Used in the downstream match chain (Layer C). |
| **Match chain** | 매치 체인 | The pipeline that scans the open web (and partner data sources) for content fingerprinted to a known seller. When a match is found, the watermark identifies which licensed copy → which buyer. Layer C. |
| **Derivative work** | 2 차 창작물 | A piece of content meaningfully transformed from a licensed source. The royalty layer (D) attributes downstream monetization of derivatives back to the original seller. |
| **2 차 수익** | 2 차 수익 | "Second-order monetization." When a buyer monetizes a derivative (publishes in a magazine, fine-tunes a model on it, sells it as part of a larger work), the per-event revenue triggers the royalty payout. |

---

## Infrastructure / process terms

| English | Korean | Definition |
|---|---|---|
| **RLS** | RLS / 행 단위 보안 | Row-Level Security. Supabase Postgres feature — policies on each row govern who can SELECT/INSERT/UPDATE/DELETE. Migrations 002, 007, 008 are the RLS authority. |
| **SECURITY DEFINER** | SECURITY DEFINER | A Postgres function that runs with the privileges of its creator (typically `service_role`), bypassing RLS for legitimate cross-user operations like `increment_view_count`. Migrations 007/008 lock `search_path = public` on all such functions. |
| **Storage bucket** | 스토리지 버킷 | A Supabase Storage bucket. VERICUM uses `vericum-content` (private), accessed via signed URLs with 300-second TTL. RLS controls inside the bucket — only the owner uploads, only buyers download via the signed URL flow. |
| **Stripe Connect** | 스트라이프 커넥트 | Stripe's product for marketplaces — sellers onboard via Express accounts, the platform charges the buyer, Stripe transfers the seller's share minus commission. The `payment_intent_data.transfer_data` in `createCheckoutSession` is the marketplace primitive. |
| **Webhook** | 웹훅 | A POST endpoint Stripe calls when a payment lifecycle event occurs. `api/payment/webhook/route.ts` is the only webhook this codebase exposes. **Must be excluded from rate limiting** (see MEMORY.md item 12). |
| **Signed URL** | 사인드 URL / 서명된 URL | A time-limited URL granting access to a private storage object without exposing the object permanently. Used for content downloads after a verified purchase. TTL 300s (5 min) in this repo. |

---

## Don't confuse

- **`content_hash`** is the SHA-256 of the binary file. Stable, exact-match only.
- **`perceptual_hash`** is a fingerprint of the visual content. Survives edits. (Currently stubbed; production-quality pHash is post-MVP.)
- **`license_key`** is a per-purchase unique identifier shown on the buyer's receipt. Not a hash; generated via `generateLicenseKey()` in `src/lib/utils/format.ts`.
- **`verified`** (status) = the verification engine declared this content authentic enough to list.
- **`active`** (status) = the content is currently available for purchase.
- **`completed`** (payment_status) = Stripe confirmed the payment and the `purchases` row exists.

A content row's lifecycle: `draft → verified → active → (sold many times) → archived`.
