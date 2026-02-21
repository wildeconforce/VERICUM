import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Upload,
  CreditCard,
  Camera,
  Fingerprint,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-24 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm mb-8 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Powered by C2PA authenticity technology</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              The Marketplace for{" "}
              <span className="text-primary">Verified</span> Digital Content
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
              Buy and sell authentic photos with guaranteed provenance.
              Every piece of content is verified using C2PA standards for
              complete transparency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/explore">
                  Explore Content
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/register">Start Selling</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                Why Vericum?
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
                    "Sellers keep 80% of every sale. Transparent commission structure with instant payouts via Stripe Connect.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="relative rounded-2xl border bg-card p-8 hover:shadow-lg transition-shadow"
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
              <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-3">
                Three simple steps to verified content
              </p>
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
                    "Our engine automatically checks C2PA manifests, EXIF metadata, and runs AI detection to score authenticity.",
                },
                {
                  step: "03",
                  icon: CreditCard,
                  title: "Sell",
                  description:
                    "Set your price and license type. Buyers can purchase with confidence knowing every piece is verified.",
                },
              ].map((step) => (
                <div key={step.step} className="text-center">
                  <div className="text-5xl font-bold text-primary/20 mb-4">
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

        {/* Pricing / Commission */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
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
                  <span className="text-2xl font-bold text-primary">80%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">
                    Platform commission
                  </span>
                  <span className="text-lg font-semibold">20%</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">
                    Buyer verification fee
                  </span>
                  <span className="text-lg font-semibold">5%</span>
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
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
              Ready to trade in verified content?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Join Vericum today and be part of the movement toward
              authentic, verified digital content.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
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
