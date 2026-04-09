import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const locales = ['en', 'ko', 'ja', 'zh', 'es', 'ar', 'fr', 'de', 'pt', 'hi'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  ar: 'العربية',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  hi: 'हिन्दी',
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  let locale: Locale = defaultLocale;

  const cookieLocale = cookieStore.get('locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    const acceptLang = headersList.get('accept-language');
    if (acceptLang) {
      const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase();
      if (preferred && locales.includes(preferred as Locale)) {
        locale = preferred as Locale;
      }
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
