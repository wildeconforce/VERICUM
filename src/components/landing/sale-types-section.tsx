"use client";

import { Crown, Percent, CheckCircle } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

export function SaleTypesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Flexible Sale Options
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Choose how you want to sell your content. Two sale types to fit
            your strategy.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <StaggerItem>
            <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all duration-300 group h-full">
              <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center mb-5 group-hover:bg-amber/15 transition-colors">
                <Crown className="h-6 w-6 text-amber" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Sale</h3>
              <p className="text-muted-foreground mb-4">
                Higher price with no secondary creation royalties. Buyers get
                full usage rights for their license type.
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
          </StaggerItem>

          <StaggerItem>
            <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all duration-300 group h-full">
              <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center mb-5 group-hover:bg-emerald/15 transition-colors">
                <Percent className="h-6 w-6 text-emerald" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Royalty Sale</h3>
              <p className="text-muted-foreground mb-4">
                Lower price with 5-10% royalty on secondary creations. More
                accessible to buyers, ongoing revenue for sellers.
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
          </StaggerItem>
        </StaggerContainer>
      </div>
    </section>
  );
}
