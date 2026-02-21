"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/content/verification-badge";
import { PriceTag } from "@/components/content/price-tag";
import { ContentGrid } from "@/components/content/content-grid";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils/format";
import { LICENSE_LABELS, LICENSE_DESCRIPTIONS } from "@/lib/constants";
import {
  ShieldCheck,
  Download,
  Heart,
  Eye,
  Calendar,
  Camera,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

function ContentDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState("standard");

  const justPurchased = searchParams.get("purchased") === "true";

  useEffect(() => {
    async function fetchContent() {
      const res = await fetch(`/api/content/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setSelectedLicense(json.content?.license_type || "standard");
      }
      setIsLoading(false);
    }
    fetchContent();
  }, [params.id]);

  useEffect(() => {
    if (justPurchased) {
      toast.success("Purchase complete! You can now download your content.");
    }
  }, [justPurchased]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/content/${params.id}`;
      return;
    }
    setIsPurchasing(true);
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: params.id,
          license_type: selectedLicense,
          provider: "stripe",
        }),
      });
      const json = await res.json();
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      } else {
        toast.error(json.error || "Failed to create checkout");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setIsPurchasing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!data?.content) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground text-lg">Content not found</p>
      </div>
    );
  }

  const { content, verification, seller, related } = data;
  const isOwner = user?.id === content.seller_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            {content.preview_url || content.thumbnail_url ? (
              <Image
                src={content.preview_url || content.thumbnail_url}
                alt={content.title}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Preview not available
              </div>
            )}
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold">{content.title}</h1>
              <VerificationBadge status={content.verification_status} size="lg" />
            </div>
            {content.description && (
              <p className="mt-3 text-muted-foreground">{content.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {content.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {content.like_count} likes
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" /> {content.download_count} downloads
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {formatDate(content.created_at)}
            </span>
          </div>

          {content.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {content.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Verification Details */}
          {verification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Verification Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Overall Score</p>
                    <p className="font-semibold text-lg">
                      {((verification.overall_score || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">C2PA</p>
                    <p className="font-semibold">
                      {verification.has_c2pa ? "Present" : "Not found"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">AI Score</p>
                    <p className="font-semibold">
                      {verification.ai_score !== null
                        ? `${((1 - verification.ai_score) * 100).toFixed(0)}% Human`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{verification.status}</p>
                  </div>
                </div>
                {verification.provenance && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Provenance Chain</p>
                      <div className="space-y-2">
                        {(verification.provenance as any[]).map((event: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div>
                              <span className="font-medium capitalize">{event.action}</span>
                              {event.device && (
                                <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Camera className="h-3 w-3" /> {event.device}
                                </span>
                              )}
                              {event.platform && (
                                <span className="text-muted-foreground"> on {event.platform}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller?.avatar_url || ""} />
                  <AvatarFallback>
                    {seller?.display_name?.[0]?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{seller?.display_name || seller?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {seller?.total_sales || 0} sales
                  </p>
                </div>
                {seller?.is_verified && (
                  <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase card */}
          {!isOwner && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <PriceTag
                  price={content.price}
                  currency={content.currency}
                  licenseType={selectedLicense}
                  showLicense
                  size="lg"
                />
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">License Type</p>
                  {["personal", "standard", "extended"].map((license) => (
                    <label
                      key={license}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedLicense === license
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:bg-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="license"
                        value={license}
                        checked={selectedLicense === license}
                        onChange={(e) => setSelectedLicense(e.target.value)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{LICENSE_LABELS[license]}</p>
                        <p className="text-xs text-muted-foreground">
                          {LICENSE_DESCRIPTIONS[license]}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Purchase
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Related content */}
      {related?.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Content</h2>
          <ContentGrid contents={related} />
        </div>
      )}
    </div>
  );
}

export default function ContentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <ContentDetailContent />
    </Suspense>
  );
}
