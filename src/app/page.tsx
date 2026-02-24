import Link from "next/link";
import { getTranslations } from "next-intl/server";
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

export default async function LandingPage() {
  const t = await getTranslations("landing");

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
                {t("manifesto.label")}
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight">
                {t("manifesto.title")}{" "}
                <span className="text-primary">{t("manifesto.titleHighlight")}</span>
              </h2>
              <div className="mt-10 space-y-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                <p>
                  {t.rich("manifesto.p1", {
                    realThing: (chunks) => <em className="text-foreground font-medium not-italic">{t("manifesto.realThing")}</em>,
                  })}
                </p>
                <p>
                  {t("manifesto.p2")}
                </p>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Scan className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{t("manifesto.verifiedOrigin")}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{t("manifesto.fullTransparency")}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 mx-auto mb-3">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{t("manifesto.tamperProof")}</p>
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
                {t("features.label")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("features.title")}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                {t("features.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Fingerprint,
                  titleKey: "features.c2pa.title" as const,
                  descKey: "features.c2pa.description" as const,
                },
                {
                  icon: Camera,
                  titleKey: "features.provenance.title" as const,
                  descKey: "features.provenance.description" as const,
                },
                {
                  icon: BarChart3,
                  titleKey: "features.marketplace.title" as const,
                  descKey: "features.marketplace.description" as const,
                },
              ].map((feature) => (
                <div
                  key={feature.titleKey}
                  className="relative rounded-2xl border bg-card p-8 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(feature.descKey)}</p>
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
                {t("howItWorks.label")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("howItWorks.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: Upload,
                  titleKey: "howItWorks.step1.title" as const,
                  descKey: "howItWorks.step1.description" as const,
                },
                {
                  step: "02",
                  icon: ShieldCheck,
                  titleKey: "howItWorks.step2.title" as const,
                  descKey: "howItWorks.step2.description" as const,
                },
                {
                  step: "03",
                  icon: CreditCard,
                  titleKey: "howItWorks.step3.title" as const,
                  descKey: "howItWorks.step3.description" as const,
                },
              ].map((step) => (
                <div key={step.step} className="text-center">
                  <div className="text-5xl font-bold text-primary/15 mb-4 font-sans">
                    {step.step}
                  </div>
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t(step.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(step.descKey)}</p>
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
                {t("saleTypes.label")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("saleTypes.title")}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                {t("saleTypes.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center mb-5">
                  <Crown className="h-6 w-6 text-amber" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("saleTypes.premium.title")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("saleTypes.premium.description")}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.premium.point1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.premium.point2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.premium.point3")}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center mb-5">
                  <Percent className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("saleTypes.royalty.title")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("saleTypes.royalty.description")}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.royalty.point1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.royalty.point2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t("saleTypes.royalty.point3")}
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
                {t("pricing.label")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t("pricing.title")}
              </h2>
              <p className="text-muted-foreground mt-3">
                {t("pricing.subtitle")}
              </p>
            </div>
            <div className="max-w-lg mx-auto rounded-2xl border bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">{t("pricing.sellerReceives")}</span>
                  <span className="text-2xl font-bold text-primary">85%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">
                    {t("pricing.platformCommission")}
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">
                    {t("pricing.buyerFee")}
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t("pricing.noMonthly")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t("pricing.instantPayouts")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t("pricing.freeVerification")}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t("pricing.licenseOptions")}</span>
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
              {t("cta.label")}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
              {t("cta.title")}{" "}
              <span className="text-primary">{t("cta.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-lg">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/register">
                  {t("cta.createAccount")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/explore">{t("cta.browseContent")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
