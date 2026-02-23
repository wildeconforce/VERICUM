"use client";

import { CheckCircle } from "lucide-react";
import { FadeIn } from "@/components/ui/motion";

export function PricingSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground mt-3">
            No hidden fees. Sellers keep the majority of every sale.
          </p>
        </FadeIn>

        <FadeIn direction="scale" delay={0.15}>
          <div className="max-w-lg mx-auto rounded-2xl border bg-card p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">Seller receives</span>
                <span className="text-2xl font-bold text-primary">85%</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-muted-foreground">
                  Platform commission (seller side)
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
        </FadeIn>
      </div>
    </section>
  );
}
