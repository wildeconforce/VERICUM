"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Content } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/content/verification-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Plus, Eye, Download, Pencil, ImageIcon } from "lucide-react";

export default function MyContentPage() {
  const { user } = useAuth();
  const t = useTranslations();
  const [contents, setContents] = useState<(Content & { _previewUrl?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("contents")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      const items: (Content & { _previewUrl?: string })[] = (data || []) as any;

      // Generate signed preview URLs for items without thumbnails
      const needsUrl = items.filter(
        (c: Content) => !c.thumbnail_url && !c.preview_url && c.original_url,
      );
      if (needsUrl.length > 0) {
        await Promise.all(
          needsUrl.map(async (c: Content & { _previewUrl?: string }) => {
            const { data: signed } = await supabase.storage
              .from("vericum-content")
              .createSignedUrl(c.original_url!, 3600);
            if (signed?.signedUrl) {
              c._previewUrl = signed.signedUrl;
            }
          }),
        );
      }

      setContents(items);
      setIsLoading(false);
    }
    fetchContent();
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("nav.myContent")}</h1>
        <Button asChild>
          <Link href="/upload">
            <Plus className="h-4 w-4 mr-2" />
            {t("nav.upload")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">No content uploaded yet</p>
            <Button asChild>
              <Link href="/upload">Upload your first content</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contents.map((content) => {
            const imgUrl = content.thumbnail_url || content.preview_url || (content as any)._previewUrl;
            return (
              <Card key={content.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Link href={`/content/${content.id}`} className="shrink-0">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={content.title} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/content/${content.id}`} className="font-medium hover:underline truncate">
                        {content.title}
                      </Link>
                      <VerificationBadge status={content.verification_status} size="sm" />
                      <Badge variant="outline" className="capitalize text-xs">
                        {content.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatPrice(content.price, content.currency)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {content.view_count}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {content.download_count}</span>
                      <span>{formatDate(content.created_at)}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/content/${content.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
