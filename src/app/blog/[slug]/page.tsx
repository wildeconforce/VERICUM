import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "introducing-vericum": {
    title: "Introducing Vericum: A New Era of Verified Content",
    date: "2026-02-12",
    category: "Announcement",
    content: `
Today, we're thrilled to announce Vericum — the first content marketplace where every piece of digital content comes with a guarantee of authenticity.

In an age where AI-generated imagery is becoming indistinguishable from photographs, and misinformation spreads through manipulated media, the need for verified content has never been greater. Vericum addresses this challenge head-on.

## What Makes Vericum Different

Unlike traditional stock photo marketplaces, Vericum verifies every upload through a multi-layered authenticity engine:

- **C2PA Manifest Analysis**: We check for Content Credentials embedded in files, providing cryptographic proof of origin.
- **EXIF Metadata Verification**: Camera data, GPS coordinates, and capture timestamps are analyzed for consistency.
- **AI Detection**: Heuristic analysis identifies content that may be AI-generated.
- **Duplicate Detection**: SHA-256 hashing ensures content uniqueness.

Each piece of content receives a composite verification score, giving buyers complete confidence in what they're purchasing.

## For Creators

If you're a photographer, photojournalist, or content creator, Vericum offers you a platform where your authentic work is valued. Sellers keep 80% of every sale, with transparent commission structures and instant payouts via Stripe Connect.

## Join Us

We're building the future of trusted digital content. Sign up today and be among the first to join the Vericum marketplace.
    `,
  },
  "what-is-c2pa": {
    title: "What is C2PA and Why It Matters for Content Creators",
    date: "2026-02-10",
    category: "Education",
    content: `
C2PA stands for the Coalition for Content Provenance and Authenticity. It's an open technical standard developed by a coalition including Adobe, Microsoft, Intel, and the BBC, designed to provide verifiable information about the origin and history of digital content.

## How C2PA Works

C2PA embeds a cryptographically signed manifest into digital files. This manifest contains:

- **Assertions**: Claims about the content, such as how it was created or edited.
- **Ingredients**: References to source materials used.
- **Signature**: A cryptographic signature from a trusted certificate authority.

When you take a photo with a C2PA-compatible camera or edit an image in C2PA-compatible software, these credentials are embedded directly into the file.

## Why It Matters

In the age of deepfakes and AI-generated content, C2PA provides a trustworthy way to verify:

1. **Who created the content** — The certificate chain traces back to the creator.
2. **When it was created** — Timestamps are cryptographically verified.
3. **How it was modified** — Every edit is recorded in the provenance chain.
4. **What tools were used** — Camera models, editing software, and more.

## C2PA at Vericum

At Vericum, C2PA is the cornerstone of our verification engine. Content with valid C2PA manifests receives the highest authenticity scores, giving buyers absolute confidence in their purchases.

As more cameras and software adopt C2PA, the ecosystem of verified content will only grow. Vericum is positioning itself at the forefront of this movement.
    `,
  },
  "ai-content-detection": {
    title: "How We Detect AI-Generated Content",
    date: "2026-02-08",
    category: "Technology",
    content: `
One of the key challenges in content verification is distinguishing between human-created and AI-generated content. At Vericum, we use a multi-layered approach to tackle this problem.

## Our Detection Approach

### 1. EXIF Integrity Analysis

Real photographs captured by cameras contain rich EXIF metadata: camera make and model, lens information, exposure settings, GPS coordinates, and more. AI-generated images typically lack this metadata or contain inconsistent data.

Our engine analyzes EXIF completeness and consistency as a strong signal of authenticity.

### 2. C2PA Manifest Presence

Content with valid C2PA manifests from trusted certificate authorities provides the strongest signal of human origin. This cryptographic proof is extremely difficult to forge.

### 3. Statistical Analysis

We examine image properties for patterns commonly associated with AI generation, including unusual frequency distributions and artifacts characteristic of diffusion models and GANs.

## Scoring System

Our composite verification score weighs these factors:

- **C2PA**: 40% (strongest signal)
- **AI Detection**: 30% (heuristic analysis)
- **EXIF Metadata**: 20% (completeness and consistency)
- **Uniqueness**: 10% (duplicate detection)

Content scoring above 70% is automatically verified. Scores between 40-70% are flagged for manual review. Below 40% results in rejection.

## Looking Forward

Post-MVP, we plan to integrate dedicated AI detection APIs for even more accurate classification. The arms race between AI generation and detection continues, and we're committed to staying ahead.
    `,
  },
  "seller-guide": {
    title: "Getting Started as a Seller on Vericum",
    date: "2026-02-06",
    category: "Guide",
    content: `
Ready to start selling your verified content on Vericum? Here's everything you need to know.

## Step 1: Create Your Account

Sign up with your email or Google account. Then upgrade to a seller account from your Settings page — it's free and instant.

## Step 2: Upload Your Content

Navigate to the Upload page and drag-and-drop your original photo. We currently support JPG, PNG, WebP, TIFF, and RAW formats up to 50MB.

**Pro tip**: For the highest verification scores, upload original files straight from your camera with full EXIF data intact. Avoid stripping metadata before upload.

## Step 3: Automatic Verification

Once uploaded, our C2PA verification engine automatically analyzes your content. You'll see the verification progress in real-time, including:

- C2PA manifest detection
- EXIF metadata analysis
- AI detection scoring
- Duplicate checking

## Step 4: Set Your Price

Choose a base price and license type:

- **Personal** (1x): Non-commercial use
- **Standard** (2x): Single commercial project
- **Extended** (5x): Unlimited commercial use
- **Exclusive** (10x+): Full rights transfer

## Step 5: Start Earning

Once verified, your content goes live on the marketplace. You'll earn 80% of every sale, with payouts processed through Stripe Connect.

## Tips for Success

1. **Keep metadata intact** — Don't strip EXIF data before uploading.
2. **Write detailed descriptions** — Help buyers find your content through search.
3. **Use relevant tags** — Up to 20 tags per upload.
4. **Choose the right category** — Helps with discovery.
5. **Price competitively** — Research similar content on the marketplace.

Welcome to Vericum — we're excited to have you!
    `,
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <article className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="mb-8">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary">{post.category}</Badge>
            <span className="text-sm text-muted-foreground">{post.date}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-8">{post.title}</h1>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            {post.content.split("\n\n").map((paragraph, i) => {
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={i} className="text-2xl font-bold mt-8 mb-4">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("### ")) {
                return (
                  <h3 key={i} className="text-xl font-semibold mt-6 mb-3">
                    {paragraph.replace("### ", "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={i} className="list-disc list-inside space-y-1 my-4">
                    {paragraph.split("\n").map((item, j) => (
                      <li key={j} className="text-muted-foreground">
                        {item.replace("- ", "")}
                      </li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.trim().match(/^\d+\./)) {
                return (
                  <ol key={i} className="list-decimal list-inside space-y-1 my-4">
                    {paragraph.split("\n").map((item, j) => (
                      <li key={j} className="text-muted-foreground">
                        {item.replace(/^\d+\.\s*/, "")}
                      </li>
                    ))}
                  </ol>
                );
              }
              if (paragraph.trim()) {
                return (
                  <p key={i} className="text-muted-foreground leading-relaxed my-4">
                    {paragraph.trim()}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
