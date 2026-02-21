import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const posts = [
  {
    slug: "introducing-vericum",
    title: "Introducing Vericum: A New Era of Verified Content",
    excerpt:
      "We're building the first marketplace where every piece of content comes with a guarantee of authenticity, powered by C2PA technology.",
    date: "2026-02-12",
    category: "Announcement",
  },
  {
    slug: "what-is-c2pa",
    title: "What is C2PA and Why It Matters for Content Creators",
    excerpt:
      "C2PA (Coalition for Content Provenance and Authenticity) is an open standard that provides verifiable information about digital content origins.",
    date: "2026-02-10",
    category: "Education",
  },
  {
    slug: "ai-content-detection",
    title: "How We Detect AI-Generated Content",
    excerpt:
      "Our multi-layered verification engine uses EXIF analysis, C2PA manifests, and heuristic AI detection to score content authenticity.",
    date: "2026-02-08",
    category: "Technology",
  },
  {
    slug: "seller-guide",
    title: "Getting Started as a Seller on Vericum",
    excerpt:
      "A complete guide to uploading, pricing, and selling your verified photography on the Vericum marketplace.",
    date: "2026-02-06",
    category: "Guide",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-muted-foreground mb-12">
            Insights on content authenticity, C2PA technology, and the creator
            economy.
          </p>
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {post.date}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                    <span className="inline-flex items-center text-sm text-primary mt-3 font-medium">
                      Read more <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
