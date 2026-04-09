"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
      toast.success("Stripe account connected successfully!");
    }
  }, [stripeConnected]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, bio }),
    });
    if (res.ok) {
      toast.success("Profile updated");
    } else {
      toast.error("Failed to update profile");
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
      toast.error("Failed to upgrade account");
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
        toast.error(data.error || "Failed to connect Stripe");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setIsConnectingStripe(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={profile?.username || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Account Type Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
            <CardDescription>Your current account role and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Current role:</span>
              <Badge variant="outline" className="capitalize">
                {profile?.role || "user"}
              </Badge>
            </div>
            {profile?.role === "user" && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to a seller account to upload and sell your verified content.
                  </p>
                  <Button onClick={handleUpgradeToSeller} disabled={isUpgrading}>
                    {isUpgrading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Upgrade to Seller
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
                Stripe Connect
              </CardTitle>
              <CardDescription>Connect your Stripe account to receive payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.stripe_account_id ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Stripe account connected</p>
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
                    Connect your Stripe account to receive payouts from sales. You&apos;ll be
                    redirected to Stripe to complete the onboarding process.
                  </p>
                  <Button onClick={handleConnectStripe} disabled={isConnectingStripe}>
                    {isConnectingStripe ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Connect Stripe Account
                  </Button>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Commission structure: 15% platform fee on each sale</p>
                <p>You receive 85% of every sale directly to your Stripe account</p>
                <p>Buyers pay an additional 15% verification fee</p>
              </div>
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
