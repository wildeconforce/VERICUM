"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBadge } from "@/components/content/verification-badge";
import { formatPrice } from "@/lib/utils/format";
import { Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function BookmarksPage() {
  const t = useTranslations();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    const res = await fetch("/api/bookmarks");
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    }
    setIsLoading(false);
  }

  const removeBookmark = async (contentId: string) => {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_id: contentId }),
    });
    if (res.ok) {
      setBookmarks((prev) => prev.filter((b) => b.content_id !== contentId));
      toast.success("Bookmark removed");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">{t("buyer.bookmarks")}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("common.noResults")}</p>
            <Button asChild>
              <Link href="/explore">{t("nav.explore")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => {
            const content = bookmark.contents;
            if (!content) return null;
            return (
              <Card key={bookmark.id} className="overflow-hidden group">
                <div className="relative aspect-[4/3] bg-muted">
                  {(content.thumbnail_url || content.preview_url) && (
                    <Image
                      src={content.thumbnail_url || content.preview_url}
                      alt={content.title}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <VerificationBadge status={content.verification_status} />
                  </div>
                </div>
                <CardContent className="p-4">
                  <Link href={`/content/${content.id}`} className="font-medium hover:underline line-clamp-1">
                    {content.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-primary">
                      {formatPrice(content.price, content.currency)}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/content/${content.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeBookmark(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
