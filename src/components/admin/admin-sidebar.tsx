"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield,
  FileSearch,
  BarChart3,
  Users,
  AlertTriangle,
  ScrollText,
} from "lucide-react";

const adminItems = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/reviews", label: "Manual Reviews", icon: FileSearch },
  { href: "/admin/content", label: "All Content", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  { href: "/admin/flags", label: "Flagged Content", icon: AlertTriangle },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" />
          <span className="font-semibold text-sm">Admin Panel</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {adminItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
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
