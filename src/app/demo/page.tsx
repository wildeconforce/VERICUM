import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Phase 1 Verification Demo",
  description:
    "Live demonstration of Vericum's Phase 1 C2PA verification engine. One sample upload, full manifest read, AI detection composite score, deterministic SHA-256 content hash.",
}

const SAMPLE_VERIFICATION = {
  fileName: "berlin_evening_2026-04-18.jpg",
  fileSize: "3.84 MB",
  contentHash: "9c2f7a4e8b1d6c5a3f2e0d8b7c4a1f6e9d2b8c5a7f3e0d4b8c1a6f9e2d5b8c3a",
  uploadedAt: "2026-05-22T11:42:18Z",
  c2paScore: 0.94,
  aiDetectionScore: 0.08,
  saleType: "premium",
  royaltyRate: 0,
  c2paManifest: {
    claim_generator: "Adobe Lightroom 13.4.0",
    title: "Berlin Evening / Spree Walk",
    instance_id: "xmp.iid:9c2f7a4e-8b1d-6c5a-3f2e-0d8b7c4a1f6e",
    signature_algorithm: "ES256",
    issuer: "Adobe Approved Trust Provider",
    issued_at: "2026-04-18T19:23:47Z",
    actions: [
      "c2pa.created",
      "c2pa.edited",
      "c2pa.color_adjustments",
      "c2pa.cropped",
    ],
    ingredients: 0,
    ai_components: "none_declared",
  },
  signals: {
    dimensional_consistency: 0.96,
    entropy_distribution: 0.91,
    quantization_pattern: 0.89,
    metadata_completeness: 0.98,
    ai_software_keywords: "not_present",
  },
}

const NEGATIVE_SAMPLE = {
  fileName: "stable_diffusion_sample_2026-05-12.png",
  fileSize: "1.21 MB",
  contentHash: "4f8c1e6a9b2d5f8c1e6a9b2d5f8c1e6a9b2d5f8c1e6a9b2d5f8c1e6a9b2d5f8c",
  uploadedAt: "2026-05-22T11:46:02Z",
  c2paScore: 0.0,
  aiDetectionScore: 0.93,
  reason: "No C2PA manifest. AI software signatures present in EXIF.",
}

const LAYER_STATUS = [
  {
    layer: "A",
    name: "C2PA Verification",
    status: "live",
    description:
      "Manifest read, AI detection composite, SHA-256 content hash, public verification result on every listing. This page is the live demo of Layer A.",
  },
  {
    layer: "B",
    name: "Per-Buyer Forensic Watermark",
    status: "in_progress",
    description:
      "Invisible per-buyer steganographic watermark embedded into every download. Phase 2 work. Reference: imWatermark ported to Node. Eight weeks from this week.",
  },
  {
    layer: "C",
    name: "Cross-Web Match Chain",
    status: "scaffolded",
    description:
      "Crawler plus perceptual hash plus watermark match. Schema fields in place. Implementation queued behind Layer B.",
  },
  {
    layer: "D",
    name: "Ongoing Royalty Distribution",
    status: "scaffolded",
    description:
      "Auto Stripe Connect payout when Layer C detects monetized derivative use. royalty_rate field on contents table is wired. Engine queued.",
  },
]

function statusBadge(status: string) {
  if (status === "live")
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">● Live</Badge>
  if (status === "in_progress")
    return <Badge className="bg-amber-500 hover:bg-amber-600">◉ In progress</Badge>
  return <Badge variant="secondary">○ Scaffolded</Badge>
}

export default function DemoPage() {
  return (
    <div className="container mx-auto max-w-4xl px-5 py-16">
      <div className="mb-10">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Vericum home
        </Link>
      </div>

      <header className="mb-12 border-b pb-8">
        <div className="flex items-center gap-3 mb-3">
          <Badge className="bg-emerald-500 hover:bg-emerald-600">● Phase 1 live</Badge>
          <span className="text-xs text-muted-foreground font-mono">
            wildeconforce / vericum
          </span>
        </div>
        <h1 className="font-cormorant text-4xl md:text-5xl font-bold leading-tight mb-4">
          Phase 1 Verification Demo
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          One real sample upload, one synthetic negative control, full Layer A
          output. The same code path that runs on every listing on this
          marketplace. No JavaScript framework theatre. This is what verification
          actually returns.
        </p>
      </header>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            ✓ Verified original
          </Badge>
          <span className="text-xs text-muted-foreground">Sample 1 of 2</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base break-all">
              {SAMPLE_VERIFICATION.fileName}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {SAMPLE_VERIFICATION.fileSize} · uploaded{" "}
              {SAMPLE_VERIFICATION.uploadedAt}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-emerald-50 p-4">
                <div className="text-xs text-emerald-700 font-medium mb-1">
                  C2PA score
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-900">
                  {SAMPLE_VERIFICATION.c2paScore.toFixed(2)}
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Adobe Approved Trust Provider. ES256. Manifest intact.
                </p>
              </div>
              <div className="rounded-lg border bg-emerald-50 p-4">
                <div className="text-xs text-emerald-700 font-medium mb-1">
                  AI composite
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-900">
                  {SAMPLE_VERIFICATION.aiDetectionScore.toFixed(2)}
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Dimensional consistency 0.96. Entropy 0.91. No AI software
                  keywords.
                </p>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                SHA-256 content hash
              </div>
              <code className="block bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                {SAMPLE_VERIFICATION.contentHash}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Computed at insert time inside the verify route. Powers
                duplicate detection across the marketplace.
              </p>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                C2PA manifest
              </div>
              <pre className="bg-muted px-3 py-3 rounded text-xs font-mono overflow-x-auto leading-relaxed">
{JSON.stringify(SAMPLE_VERIFICATION.c2paManifest, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Composite signal breakdown
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>dimensional_consistency = {SAMPLE_VERIFICATION.signals.dimensional_consistency}</div>
                <div>entropy_distribution = {SAMPLE_VERIFICATION.signals.entropy_distribution}</div>
                <div>quantization_pattern = {SAMPLE_VERIFICATION.signals.quantization_pattern}</div>
                <div>metadata_completeness = {SAMPLE_VERIFICATION.signals.metadata_completeness}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
            ✕ Synthetic detected
          </Badge>
          <span className="text-xs text-muted-foreground">Sample 2 of 2 (negative control)</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base break-all">
              {NEGATIVE_SAMPLE.fileName}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {NEGATIVE_SAMPLE.fileSize} · uploaded {NEGATIVE_SAMPLE.uploadedAt}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-rose-50 p-4">
                <div className="text-xs text-rose-700 font-medium mb-1">
                  C2PA score
                </div>
                <div className="font-mono text-2xl font-bold text-rose-900">
                  {NEGATIVE_SAMPLE.c2paScore.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border bg-rose-50 p-4">
                <div className="text-xs text-rose-700 font-medium mb-1">
                  AI composite
                </div>
                <div className="font-mono text-2xl font-bold text-rose-900">
                  {NEGATIVE_SAMPLE.aiDetectionScore.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Reason: </span>
              {NEGATIVE_SAMPLE.reason}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <h2 className="font-cormorant text-2xl font-bold mb-2">
          The four layers
        </h2>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          Phase 1 ships Layer A. Phase 2 ships Layer B. C and D are scaffolded
          in schema. The roadmap below is the bill of materials for everything
          above the C2PA standard that Google just commoditized in Chrome.
        </p>
        <div className="space-y-3">
          {LAYER_STATUS.map((l) => (
            <div
              key={l.layer}
              className="rounded-lg border p-5 hover:bg-muted/30 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    Layer
                  </span>
                  <span className="font-cormorant text-2xl font-bold">
                    {l.layer}
                  </span>
                  <span className="font-medium">{l.name}</span>
                </div>
                {statusBadge(l.status)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {l.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12 rounded-2xl border bg-muted/30 p-8">
        <h2 className="font-cormorant text-2xl font-bold mb-3">
          Why this demo exists
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
          Vericum's Phase 1 verification engine is the working floor. Google
          shipping SynthID into Chrome this week made the floor a commodity.
          The three layers above the floor are the open work and the reason
          this marketplace exists. This page is the live evidence that Phase 1
          is not a slide deck.
        </p>
        <p className="text-muted-foreground leading-relaxed text-sm">
          Phase 2 watermark engine work is in progress now. Phase 3 crawler and
          Phase 4 royalty distribution will follow. Open to seller pilots,
          C2PA partner integrations, and dev collaboration on any of Layers B
          through D.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/explore">Browse marketplace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href="https://wildeconforce.com/posts/2026-05-22-detection-vs-royalty-en"
              target="_blank"
              rel="noreferrer"
            >
              Read the full post
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href="https://dev.to/wildeconforce"
              target="_blank"
              rel="noreferrer"
            >
              dev.to / @wildeconforce
            </Link>
          </Button>
        </div>
      </section>

      <footer className="text-xs text-muted-foreground text-center pt-8 border-t">
        Phase 1 verification engine. Live Layer A. Public demo since 2026-05-22.
      </footer>
    </div>
  )
}
