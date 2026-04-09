import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations('footer');
  const tc = await getTranslations('common');

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold font-serif">{tc('appName')}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('marketplace')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/explore" className="hover:text-foreground transition-colors">
                  {t('explore')}
                </Link>
              </li>
              <li>
                <Link href="/explore?category=photojournalism" className="hover:text-foreground transition-colors">
                  {t('photojournalism')}
                </Link>
              </li>
              <li>
                <Link href="/explore?category=nature-wildlife" className="hover:text-foreground transition-colors">
                  {t('natureWildlife')}
                </Link>
              </li>
              <li>
                <Link href="/explore?category=portrait" className="hover:text-foreground transition-colors">
                  {t('portrait')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">{t('forSellers')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  {t('startSelling')}
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-foreground transition-colors">
                  {t('uploadContent')}
                </Link>
              </li>
              <li>
                <Link href="/earnings" className="hover:text-foreground transition-colors">
                  {t('earnings')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
