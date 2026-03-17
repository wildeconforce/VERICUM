"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, isSeller, signOut } = useAuth();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("toggleMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetTitle className="font-serif text-lg">{t("menu")}</SheetTitle>
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Link
              href="/search"
              className="text-sm text-muted-foreground"
              onClick={close}
            >
              {t("searchContent")}
            </Link>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/explore"
              onClick={close}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === "/explore"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              {t("explore")}
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {t("dashboard")}
                </Link>
                {isSeller && (
                  <>
                    <Link href="/upload" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                      {t("upload")}
                    </Link>
                    <Link href="/my-content" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                      {t("myContent")}
                    </Link>
                    <Link href="/earnings" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                      {t("earnings")}
                    </Link>
                  </>
                )}
                <Link href="/purchases" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {t("purchases")}
                </Link>
                <Link href="/downloads" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {t("downloads")}
                </Link>
                <Link href="/bookmarks" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {t("bookmarks")}
                </Link>
                <Link href="/settings" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {t("settings")}
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    close();
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent text-left text-destructive"
                >
                  {tc("signOut")}
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link href="/login" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                  {tc("signIn")}
                </Link>
                <Link href="/register" onClick={close} className="rounded-lg px-3 py-2 text-sm font-medium bg-primary text-primary-foreground text-center">
                  {tc("getStarted")}
                </Link>
              </>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
