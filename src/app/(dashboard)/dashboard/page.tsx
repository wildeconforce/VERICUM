"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Upload,
  Eye,
  Download,
  Heart,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { formatPrice } from "@/lib/utils/format";

export default function DashboardPage() {
  const { profile, isSeller } = useAuth();
  const [earnings, setEarnings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  useEffect(() => {
    async function fetchData() {
      if (isSeller) {
        const res = await fetch("/api/user/earnings?period=month");
        if (res.ok) {
          setEarnings(await res.json());
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [isSeller]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("welcome", { name: profile?.display_name || "there" })}
          </p>
        </div>
        {isSeller && (
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              {t("uploadContent")}
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isSeller && (
          <>
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("totalEarnings")}</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatPrice(earnings?.total_earnings || profile?.total_earnings || 0)}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t("totalSales")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {earnings?.sales_count || profile?.total_sales || 0}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("myUploads")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{profile?.total_uploads || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("purchasesCount")}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-4">{t("quickActions")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/explore" className="group">
          <Card className="hover:shadow-md transition-all hover:border-primary/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{t("exploreContent")}</p>
                <p className="text-xs text-muted-foreground">{t("browseVerified")}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/purchases" className="group">
          <Card className="hover:shadow-md transition-all hover:border-primary/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{t("myDownloads")}</p>
                <p className="text-xs text-muted-foreground">{t("accessPurchased")}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/bookmarks" className="group">
          <Card className="hover:shadow-md transition-all hover:border-primary/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{t("bookmarks")}</p>
                <p className="text-xs text-muted-foreground">{t("savedForLater")}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
        {isSeller && (
          <>
            <Link href="/earnings" className="group">
              <Card className="hover:shadow-md transition-all hover:border-primary/30">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t("earningsAnalytics")}</p>
                    <p className="text-xs text-muted-foreground">{t("viewRevenueStats")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/my-content" className="group">
              <Card className="hover:shadow-md transition-all hover:border-primary/30">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t("myContent")}</p>
                    <p className="text-xs text-muted-foreground">{t("manageUploads")}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </>
        )}
        {!profile?.stripe_account_id && isSeller && (
          <Link href="/settings" className="group">
            <Card className="hover:shadow-md transition-all border-amber/30">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-amber" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("connectStripe")}</p>
                  <p className="text-xs text-muted-foreground">{t("setUpPayments")}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber transition-colors" />
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
