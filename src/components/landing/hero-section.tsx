"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FadeIn, FloatingOrb } from "@/components/ui/motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-24 lg:py-36">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
          delay={0}
        />
        <FloatingOrb
          className="absolute top-1/2 -left-32 h-72 w-72 rounded-full bg-primary/3 blur-3xl"
          delay={2}
        />
        <FloatingOrb
          className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-emerald/5 blur-3xl"
          delay={4}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="container mx-auto px-4 text-center relative">
        <FadeIn delay={0}>
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm mb-8 backdrop-blur-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("badge")}</span>
          </motion.div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl mx-auto leading-[1.1]">
            {t("titlePre")}{" "}
            <span className="text-primary relative">
              {t("titleHighlight")}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 8C30 3 70 2 100 5C130 8 170 6 198 3"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary/40"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
                />
              </svg>
            </span>{" "}
            {t("titlePost")}
          </h1>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            {t("subtitle")}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button size="lg" asChild className="text-base px-8 group">
              <Link href="/explore">
                {t("exploreBtn")}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link href="/register">{t("sellBtn")}</Link>
            </Button>
          </div>
        </FadeIn>

        {/* Trust indicators */}
        <FadeIn delay={0.55}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald" />
              <span>{t("trustC2pa")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald" />
              <span>{t("trustRevenue")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald" />
              <span>{t("trustPayouts")}</span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
