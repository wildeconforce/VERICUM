"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Content } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/content/verification-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Plus, Eye, Download, Pencil } from "lucide-react";

export default function MyContentPage() {
  const { user } = useAuth();
  const [contents, setContents] = useState<Content[]>([]);
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
      setContents(data || []);
      setIsLoading(false);
    }
    fetchContent();
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Content</h1>
        <Button asChild>
          <Link href="/upload">
            <Plus className="h-4 w-4 mr-2" />
            Upload New
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
          {contents.map((content) => (
            <Card key={content.id}>
              <CardContent className="p-4 flex items-center gap-4">
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
          ))}
        </div>
      )}
    </div>
  );
}
