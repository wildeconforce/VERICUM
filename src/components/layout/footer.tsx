import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold font-serif">Vericum</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Verified content marketplace powered by C2PA authenticity technology.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/explore" className="hover:text-foreground transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/explore?category=photojournalism" className="hover:text-foreground transition-colors">
                  Photojournalism
                </Link>
              </li>
              <li>
                <Link href="/explore?category=nature-wildlife" className="hover:text-foreground transition-colors">
                  Nature & Wildlife
                </Link>
              </li>
              <li>
                <Link href="/explore?category=portrait" className="hover:text-foreground transition-colors">
                  Portrait
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">For Sellers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Start Selling
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-foreground transition-colors">
                  Upload Content
                </Link>
              </li>
              <li>
                <Link href="/earnings" className="hover:text-foreground transition-colors">
                  Earnings
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vericum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
