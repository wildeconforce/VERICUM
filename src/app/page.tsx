import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SaleTypesSection } from "@/components/landing/sale-types-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SaleTypesSection />
        <PricingSection />

        {/* CTA */}
        <section className="py-24 bg-gradient-to-t from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
                Ready to trade in verified content?
              </h2>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                Join Vericum today and be part of the movement toward
                authentic, verified digital content.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Button size="lg" asChild className="text-base px-8 group">
                  <Link href="/register">
                    Create Free Account
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-8">
                  <Link href="/explore">Browse Content</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
