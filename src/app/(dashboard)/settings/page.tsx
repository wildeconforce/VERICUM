"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, CreditCard, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

function SettingsContent() {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { user, profile, isSeller } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const stripeConnected = searchParams.get("stripe") === "connected";

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  useEffect(() => {
    if (stripeConnected) {
      toast.success(t("settings.stripeConnected"));
    }
  }, [stripeConnected, t]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, bio }),
    });
    if (res.ok) {
      toast.success(t("settings.profileUpdated"));
    } else {
      toast.error(t("common.error"));
    }
    setIsSaving(false);
  };

  const handleUpgradeToSeller = async () => {
    if (!user) return;
    setIsUpgrading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: "seller" } as never)
      .eq("id", user.id);
    if (error) {
      toast.error(t("common.error"));
    } else {
      toast.success("Account upgraded to seller! Please refresh the page.");
    }
    setIsUpgrading(false);
  };

  const handleConnectStripe = async () => {
    setIsConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    }
    setIsConnectingStripe(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t("settings.title")}</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.email")}</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("common.username")}</Label>
              <Input value={profile?.username || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t("common.displayName")}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{t("common.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {t("settings.saveChanges")}
            </Button>
          </CardContent>
        </Card>

        {/* Account Type Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.accountType")}</CardTitle>
            <CardDescription>{t("settings.accountTypeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">{t("settings.currentRole")}:</span>
              <Badge variant="outline" className="capitalize">
                {profile?.role || "user"}
              </Badge>
            </div>
            {profile?.role === "user" && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("settings.upgradeDesc")}
                  </p>
                  <Button onClick={handleUpgradeToSeller} disabled={isUpgrading}>
                    {isUpgrading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("settings.upgradeToSeller")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stripe Connect Card - Sellers only */}
        {isSeller && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("settings.stripeConnect")}
              </CardTitle>
              <CardDescription>{t("settings.stripeConnectDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.stripe_account_id ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.stripeConnected")}</p>
                    <p className="text-xs text-muted-foreground">
                      Account ID: {profile.stripe_account_id.slice(0, 8)}...
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={handleConnectStripe}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("settings.stripeConnectDesc")}
                  </p>
                  <Button onClick={handleConnectStripe} disabled={isConnectingStripe}>
                    {isConnectingStripe ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {t("settings.connectStripe")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mt-12" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
