import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import {
  ShieldCheck,
  Upload,
  CreditCard,
  Camera,
  Fingerprint,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Crown,
  Percent,
} from "lucide-react";

export default async function LandingPage() {
  const t = await getTranslations('landing');
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-24 lg:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 text-center relative">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm mb-8 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
              {t.rich('hero.title', {
                highlight: (chunks) => <span className="text-primary">{chunks}</span>
              })}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/explore">
                  {t('hero.exploreBtn')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/register">{t('hero.sellBtn')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('features.title')}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Fingerprint,
                  key: "c2pa",
                  title: t('features.c2pa.title'),
                  description: t('features.c2pa.description'),
                },
                {
                  icon: Camera,
                  key: "provenance",
                  title: t('features.provenance.title'),
                  description: t('features.provenance.description'),
                },
                {
                  icon: BarChart3,
                  key: "marketplace",
                  title: t('features.marketplace.title'),
                  description: t('features.marketplace.description'),
                },
              ].map((feature) => (
                <div
                  key={feature.key}
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
              <h2 className="text-3xl md:text-4xl font-bold">{t('howItWorks.title')}</h2>
              <p className="text-muted-foreground mt-3">
                {t('howItWorks.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: Upload,
                  title: t('howItWorks.step1.title'),
                  description: t('howItWorks.step1.description'),
                },
                {
                  step: "02",
                  icon: ShieldCheck,
                  title: t('howItWorks.step2.title'),
                  description: t('howItWorks.step2.description'),
                },
                {
                  step: "03",
                  icon: CreditCard,
                  title: t('howItWorks.step3.title'),
                  description: t('howItWorks.step3.description'),
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

        {/* Sale Types */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('saleTypes.title')}
              </h2>
              <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
                {t('saleTypes.subtitle')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center mb-5">
                  <Crown className="h-6 w-6 text-amber" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('saleTypes.premium.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('saleTypes.premium.description')}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.premium.benefit1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.premium.benefit2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.premium.benefit3')}
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-emerald/10 flex items-center justify-center mb-5">
                  <Percent className="h-6 w-6 text-emerald" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('saleTypes.royalty.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('saleTypes.royalty.description')}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.royalty.benefit1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.royalty.benefit2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {t('saleTypes.royalty.benefit3')}
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
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('pricing.title')}
              </h2>
              <p className="text-muted-foreground mt-3">
                {t('pricing.subtitle')}
              </p>
            </div>
            <div className="max-w-lg mx-auto rounded-2xl border bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">{t('pricing.sellerReceives')}</span>
                  <span className="text-2xl font-bold text-primary">85%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">
                    {t('pricing.platformCommission')}
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-muted-foreground">
                    {t('pricing.buyerFee')}
                  </span>
                  <span className="text-lg font-semibold">15%</span>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t('pricing.noMonthly')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t('pricing.instantPayouts')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t('pricing.freeVerification')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
                  <span>{t('pricing.licenseOptions')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-t from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
              {t('cta.title')}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/register">
                  {t('cta.createAccount')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="/explore">{t('cta.browseContent')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
