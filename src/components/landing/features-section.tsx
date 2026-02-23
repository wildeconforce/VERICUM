"use client";

import { Fingerprint, Camera, BarChart3 } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const features = [
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
      "Sellers keep 85% of every sale. Transparent 15% commission structure with instant payouts via Stripe Connect.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Why Vericum?</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            The first content marketplace that guarantees authenticity
            through cutting-edge verification technology.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="relative rounded-2xl border bg-card p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
