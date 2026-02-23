"use client";

import { Upload, ShieldCheck, CreditCard } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion";

const steps = [
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
];

export function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-3">
            Three simple steps to verified content
          </p>
        </FadeIn>

        <StaggerContainer
          className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto"
          staggerDelay={0.15}
        >
          {steps.map((step, index) => (
            <StaggerItem key={step.step}>
              <div className="text-center relative">
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-border to-border via-primary/20" />
                )}
                <div className="text-5xl font-bold text-primary/15 mb-4 font-sans">
                  {step.step}
                </div>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
