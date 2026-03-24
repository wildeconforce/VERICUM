"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface FlaggedItem {
  id: string;
  content_id: string;
  content_title: string;
  vtl_score: number;
  vtl_tier: string;
  vtl_flags: { type: string; code: string; message: string }[];
  status: string;
  created_at: string;
}

export default function FlaggedContentPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/flags")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Flagged Content
        </h1>
        <p className="text-muted-foreground">Content with critical or warning VTL flags</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No flagged content found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.content_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      VTL: {(item.vtl_score * 100).toFixed(1)}% | Tier: {item.vtl_tier} | Status: {item.status}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.vtl_flags?.map((flag, i) => (
                        <Badge
                          key={i}
                          variant={flag.type === "critical" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {flag.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <a
                    href={`/admin/reviews`}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Review →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
