"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search/search-bar";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSelector } from "./language-selector";
import { MobileNav } from "./mobile-nav";
import {
  Upload,
  LayoutDashboard,
  Package,
  DollarSign,
  Settings,
  LogOut,
  ShieldCheck,
  Heart,
  ShoppingBag,
  Download,
} from "lucide-react";

export function Header() {
  const { user, profile, isAuthenticated, isSeller, signOut } = useAuth();
  const t = useTranslations('nav');
  const tc = useTranslations('common');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-serif tracking-tight">
              {tc('appName')}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('explore')}
            </Link>
            {isSeller && (
              <Link
                href="/upload"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('upload')}
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {isSeller && (
                <Button variant="outline" size="sm" asChild className="hidden sm:flex ml-2">
                  <Link href="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('upload')}
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ml-1"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={profile?.avatar_url || ""}
                        alt={profile?.display_name || ""}
                      />
                      <AvatarFallback>
                        {profile?.display_name?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">
                        {profile?.display_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t('dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  {isSeller && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/my-content">
                          <Package className="h-4 w-4 mr-2" />
                          {t('myContent')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/earnings">
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t('earnings')}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/purchases">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('purchases')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/downloads">
                      <Download className="h-4 w-4 mr-2" />
                      {t('downloads')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">
                      <Heart className="h-4 w-4 mr-2" />
                      {t('bookmarks')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {tc('signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{tc('signIn')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{tc('getStarted')}</Link>
              </Button>
            </div>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
