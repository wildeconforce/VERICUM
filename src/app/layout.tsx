import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
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
  keywords: ["verified content", "C2PA", "content marketplace", "digital authenticity", "stock photos"],
  openGraph: {
    title: "Vericum — Verified Content Marketplace",
    description:
      "Buy and sell verified digital content with C2PA authenticity.",
    siteName: "Vericum",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${cormorant.variable} antialiased`}
      >
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
