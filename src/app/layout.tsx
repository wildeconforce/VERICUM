import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vericum — Verified Content Marketplace",
    template: "%s | Vericum",
  },
  description:
    "Buy and sell verified digital content with C2PA authenticity. Guaranteed provenance for photos, videos, and more.",
  keywords: [
    "verified content",
    "C2PA",
    "content marketplace",
    "digital authenticity",
    "stock photos",
    "content provenance",
  ],
  openGraph: {
    title: "Vericum — Verified Content Marketplace",
    description:
      "Buy and sell verified digital content with C2PA authenticity.",
    siteName: "Vericum",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vericum — Verified Content Marketplace",
    description:
      "Buy and sell verified digital content with C2PA authenticity.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${cormorant.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
