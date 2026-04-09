"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Download, ExternalLink, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPurchases() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("purchases")
        .select("*, contents(id, title, thumbnail_url, preview_url, original_url)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      const items = data || [];

      // Generate signed preview URLs for contents without thumbnails
      const contents = items.map((p: any) => p.contents).filter(Boolean);
      const needsUrl = contents.filter(
        (c: any) => !c.thumbnail_url && !c.preview_url && c.original_url,
      );
      if (needsUrl.length > 0) {
        await Promise.all(
          needsUrl.map(async (c: any) => {
            const { data: signed } = await supabase.storage
              .from("vericum-content")
              .createSignedUrl(c.original_url, 3600);
            if (signed?.signedUrl) {
              c._previewUrl = signed.signedUrl;
            }
          }),
        );
      }

      setPurchases(items);
      setIsLoading(false);
    }
    fetchPurchases();
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Purchases</h1>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No purchases yet</p>
            <Button asChild>
              <Link href="/explore">Browse content</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const c = purchase.contents;
            const imgUrl = c?.thumbnail_url || c?.preview_url || c?._previewUrl;
            return (
              <Card key={purchase.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Link href={`/content/${purchase.content_id}`} className="shrink-0">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={c?.title || ""} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/content/${purchase.content_id}`} className="font-medium hover:underline">
                      {c?.title || "Content"}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatPrice(purchase.amount, purchase.currency)}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {purchase.payment_status}
                      </Badge>
                      <span>{formatDate(purchase.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/content/${purchase.content_id}`}>
                        <ExternalLink className="h-3 w-3 mr-1" /> View
                      </Link>
                    </Button>
                    {purchase.payment_status === "completed" && (
                      <Button size="sm">
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
