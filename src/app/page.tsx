import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Upload,
  CreditCard,
  Fingerprint,
  Camera,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Crown,
  Percent,
  Scan,
  Eye,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />

        {/* Manifesto — What is Vericum */}
        <section className="py-28 lg:py-36 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/3 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-6">
                Our Belief
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
                In the age of infinite fakes,{" "}
                <span className="text-primary">truth becomes the ultimate luxury.</span>
              </h2>
              <div className="mt-10 space-y-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                <p>
                  AI can now generate anything. Photos, videos, documents — all indistinguishable from reality.
                  But that makes the <em className="text-foreground font-medium not-italic">real thing</em> more valuable than ever.
                </p>
                <p>
                  Vericum is where authenticity is proven, not just claimed.
                  We use C2PA standards — the same technology backed by Adobe, Google, Microsoft, and the BBC —
                  to cryptographically verify every piece of content on our platform.
                </p>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Scan className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Verified Origin</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Full Transparency</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Tamper-Proof</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-3">
                Why Vericum
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Built for the Post-AI Era
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                The first content marketplace that guarantees authenticity
                through cutting-edge verification technology.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Fingerprint,
                  title: "C2PA Verification",
                  description:
                    "Every upload is analyzed for C2PA manifests, EXIF data, and AI-generation markers. Know exactly where your content comes from.",
                },
                {
                  icon: Camera,
                  title: "Provenance Tracking",
                  description:
                    "Complete chain of custody from camera to marketplace. See the full history of how content was created and edited.",
                },
                {
                  icon: BarChart3,
                  title: "Fair Marketplace",
                  description:
                    "Sellers keep 85% of every sale. Transparent commission structure with instant payouts via Stripe Connect.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative rounded-2xl border bg-card p-8 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-3">
                How It Works
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Three Steps to Verified Content
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: "Upload",
                  description:
                    "Drag and drop your original photo. We support JPG, PNG, WebP, TIFF, and RAW formats up to 50MB.",
                },
                {
                  step: "02",
                  icon: ShieldCheck,
                  title: "Verify",
                  description:
                    "Our engine checks C2PA manifests, EXIF metadata, and runs AI detection to score authenticity — automatically.",
                },
                {
                  step: "03",
                  icon: CreditCard,
                  title: "Sell",
                  description:
                    "Set your price and license type. Buyers purchase with confidence knowing every piece is verified.",
                },
              ].map((step) => (
                <div key={step.step} className="text-center">
                  <div className="text-5xl font-bold text-primary/15 mb-4 font-sans">
                    {step.step}
                  </div>
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sale Types */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-3">
                Sale Options
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Flexible Ways to Sell
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                Choose how you want to sell your content. Two sale types to fit your strategy.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center mb-5">
                  <Crown className="h-6 w-6 text-amber" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Sale</h3>
                <p className="text-muted-foreground mb-4">
                  Higher price with no secondary creation royalties. Buyers get full usage rights for their license type.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    Full price per license
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    No ongoing royalty obligations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    Best for exclusive content
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center mb-5">
                  <Percent className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Royalty Sale</h3>
                <p className="text-muted-foreground mb-4">
                  Lower price with 5-10% royalty on secondary creations. More accessible to buyers, ongoing revenue for sellers.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    40% discounted price for buyers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    5-10% royalty on derivative works
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    Great for high-volume content
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / Commission */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-3">
                Pricing
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                Simple, Transparent Pricing
              </h2>
              <p className="text-muted-foreground mt-3">
                No hidden fees. Sellers keep the majority of every sale.
              </p>
            </div>
            <div className="max-w-lg mx-auto rounded-2xl border bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Seller receives</span>
                  <span className="text-2xl font-bold text-primary">85%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">
                    Platform commission
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">
                    Buyer verification fee
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>No monthly fees or subscriptions</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>Instant payouts via Stripe Connect</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>Free C2PA verification on all uploads</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>Personal, Standard, Extended &amp; Exclusive license options</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-primary/2 to-transparent" />
          <div className="container mx-auto px-4 text-center relative">
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-primary mb-4">
              Join the Movement
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
              The world needs proof.{" "}
              <span className="text-primary">Be the proof.</span>
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-lg">
              Whether you create authentic content or need verified originals,
              Vericum is where truth is traded.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/register">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/explore">Browse Content</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
