# VERICUM PROJECT HANDOFF
## Claude Code Context Transfer Document
> Date: 2026-02-12
> Founder: Jack An (안승호)
> Domain: vericum.com (registered via Korean registrar)

---

## 1. WHAT IS VERICUM

**One-liner:** AI 시대 진본 인증 콘텐츠 마켓플레이스 (AI-Verified Authentic Content Marketplace)

**Core Concept:**
- AI가 가짜 콘텐츠를 무한 생성하는 시대에, "진짜"를 증명하고 거래하는 플랫폼
- C2PA (Coalition for Content Provenance and Authenticity) 기반 진본 검증
- 사진, 영상, 문서의 인간 원본 증명 + 마켓플레이스
- "Shutterstock이 스톡포토를 만들었다면, Vericum은 AI 시대의 진본 인증 마켓을 만든다"

**Brand Name Origin:**
- Latin: "verus" (진짜/true) + "-icum" (관련된/pertaining to)
- Pronunciation: VEH-ri-kum (베리쿰), 3 syllables
- Associations: verify, verity, veritas — all "truth/verification" family
- Domain: vericum.com (.com 신규등록, 매입 아님)

---

## 2. MARKET VALIDATION

**TAM (Total Addressable Market):**
- AI Detection Market: $6.96B (2030 projected)
- Stock Photography Market: $5.62B (2030 projected)
- Vericum sits at the intersection of both — no incumbent exists

**Why Now:**
- C2PA standard expanding (Adobe, Google, Microsoft, BBC backing)
- EU AI Act requiring AI content labeling
- US AI transparency legislation in progress
- Deepfake incidents increasing across news, legal, insurance sectors
- Everyone is building AI generation tools — nobody is building the "proof of real" layer

**Competitive Landscape:**
- NO direct competitor exists for "verified authentic content marketplace"
- Adjacent players: Shutterstock (stock photos, no verification), Getty (premium, no C2PA marketplace), Content Credentials (Adobe, tool not marketplace), Truepic (enterprise verification, not marketplace)

---

## 3. BUSINESS MODEL

**Revenue Streams:**
1. Seller Commission: 20-25% per transaction
2. Buyer Verification Fee: 5-10% per purchase
3. B2B API Subscription: News agencies, legal firms, insurance companies
4. Certification SaaS: White-label verification for enterprises

**Target Users:**
- Sellers: Photojournalists, documentary filmmakers, event photographers, citizen journalists
- Buyers: News agencies, legal firms, insurance companies, marketing agencies, publishers
- Enterprise: Media companies needing verified content pipelines

---

## 4. TECH STACK (Planned)

**Phase 1 — Landing & Blog:**
- WordPress + JNews theme (Jack already uses JNews for WildEconForce)
- Hosted on Korean provider (Cafe24 or Gabia)

**Phase 2 — MVP Marketplace:**
- Frontend: React / Next.js
- Backend: Supabase or Firebase (rapid MVP)
- Alternative WP route: WooCommerce + Dokan (multi-vendor marketplace plugin)
- C2PA verification: c2pa-js library / Content Credentials API
- Payments: Toss Payments (Korea) + Stripe (Global)

**Phase 3 — Scale:**
- Custom backend (Node.js or Python)
- AWS/GCP infrastructure
- Dedicated C2PA verification engine
- API for B2B clients

---

## 5. FOUNDER CONTEXT

**Jack An (안승호):**
- Operates WildEconForce — Korean investment analysis platform, 100M+ views
- Expert in: SEO, WordPress/JNews, content strategy, financial analysis
- EFA System: Proprietary market analysis methodology
- Audience: Large Korean investor community + growing US traffic
- Cross-promotion potential: WildEconForce → Vericum pipeline

**Jack's Strengths (handles these):**
- Business decisions, hosting setup, business registration
- Payment system contracts (PG companies)
- Content marketing via WildEconForce
- VC meetings, team building, partnerships
- All final decisions

**Claude's Role (handles these):**
- Brand identity (logo concepts, slogans, guidelines)
- Landing page design & code
- Business plan / pitch deck creation
- Marketplace frontend development
- C2PA verification engine design
- Blog content series (SEO-optimized)
- Market research & competitor analysis
- Legal document drafts (ToS, Privacy Policy)
- Financial modeling & projections

---

## 6. ROADMAP — SPRINT MODE

**Pace: 최대한 빠르게. 기간 설정 없음.**
**Rule: 하루 허용된 섹션 한도 내에서 최대 산출물 → 한도 소진 → 리필 대기 → 재작업**

### Execution Order (순서대로 실행):

| # | Task | Owner | Output |
|---|------|-------|--------|
| 1 | Brand Identity (로고 컨셉, 컬러, 슬로건, 톤) | Claude | 브랜드 가이드라인 |
| 2 | Landing Page (디자인 + 풀 코드) | Claude | HTML/React |
| 3 | Blog Post Series (SEO 콘텐츠 5-8편) | Claude | Markdown/HTML |
| 4 | WP Hosting Setup + JNews Install | Jack | vericum.com LIVE |
| 5 | Domain Connect + Theme Apply | Jack | 사이트 세팅 완료 |
| 6 | Business Plan (한글+영문) | Claude | .docx |
| 7 | MVP Tech Spec (마켓플레이스 설계) | Claude | 기술 문서 |
| 8 | Marketplace UI/UX Wireframe | Claude | 디자인 파일 |
| 9 | Marketplace Frontend Code | Claude | React/Next.js |
| 10 | C2PA Verification Engine Design | Claude | API 스펙 |
| 11 | Legal Docs (이용약관, 개인정보처리방침) | Claude | .docx |
| 12 | Pitch Deck (투자용) | Claude | .pptx |
| 13 | Financial Model | Claude | .xlsx |
| 14 | VC Outreach + Meetings | Jack | 투자 유치 |

**How it works:**
- Claude: 한도 차면 바로 다음 태스크 실행, 소진되면 대기
- Jack: Claude 산출물 받으면 호스팅/세팅/검토 병행
- 둘 다 쉬는 시간 없이 한도만큼 최대 속도로 진행

---

## 7. KEY DECISIONS MADE

- [x] Business concept validated (AI-verified authentic content marketplace)
- [x] Brand name: Vericum (Latin root, 3-syllable, .com available)
- [x] Domain registered: vericum.com
- [x] Phase 1 platform: WordPress + JNews
- [x] Role assignment document created (see vericum_project_roles.docx)
- [ ] Hosting provider: TBD (Cafe24 vs Gabia vs other)
- [ ] Business registration: TBD (개인사업자 vs 법인)
- [ ] Brand identity: TBD (logo, color, slogan)
- [ ] Landing page: TBD

---

## 8. FILES CREATED

1. `vericum_project_roles.docx` — Full role assignment & 12-month roadmap document

---

## 9. FOUNDER'S VISION (Jack's own words)

> "아직 AI로 뭔가를 만드는데 집중된 시기야. 우린 역행을 해서 AI로 컨텐츠를 만드는 사람의 진짜 기억을 파는 플랫폼인거고. 우리가 세상에 꼭 필요할꺼야 아마."

> Total Recall 비유: 리콜이 "가짜 기억을 진짜처럼 심어주는" 회사라면, Vericum은 정반대 — "진짜를 진짜라고 증명해주는" 회사.

> "In the age of infinite fakes, truth becomes the ultimate luxury." — Vericum tagline

---

## 10. INSTRUCTIONS FOR CLAUDE CODE

When continuing this project in Claude Code:
1. Read this file first to understand full context
2. Jack communicates in Korean, casual style (uses 형, ㅋㅋ, etc.)
3. Jack prefers practical, action-oriented outputs over theory
4. All deliverables should be production-ready files, not explanations
5. Respect the "천천히" (take it slow) pace — no rushing
6. Jack's WordPress expertise is high — leverage JNews capabilities
7. Cross-reference WildEconForce content strategy when relevant
8. Always provide Korean + English versions for global materials
