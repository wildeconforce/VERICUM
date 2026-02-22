"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  Settings,
  Upload,
  Heart,
  Download,
} from "lucide-react";

const sidebarItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/my-content", label: "My Content", icon: Package, sellerOnly: true },
  { href: "/upload", label: "Upload", icon: Upload, sellerOnly: true },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/bookmarks", label: "Bookmarks", icon: Heart },
  { href: "/earnings", label: "Earnings", icon: DollarSign, sellerOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSeller } = useAuth();

  const filteredItems = sidebarItems.filter(
    (item) => !item.sellerOnly || isSeller
  );

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
