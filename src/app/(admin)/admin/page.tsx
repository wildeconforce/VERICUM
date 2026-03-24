"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileSearch,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";

interface AdminStats {
  totalContent: number;
  verified: number;
  rejected: number;
  pendingReview: number;
  totalUsers: number;
  totalSellers: number;
  recentVerifications: {
    id: string;
    content_title: string;
    status: string;
    vtl_tier: string | null;
    overall_score: number;
    created_at: string;
  }[];
}

export default function AdminOverviewPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">Platform health and content moderation</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pending Reviews"
              value={stats.pendingReview}
              icon={<FileSearch className="h-5 w-5" />}
              color="text-amber-500"
              action={{ label: "Review now", href: "/admin/reviews" }}
            />
            <StatCard
              title="Verified Content"
              value={stats.verified}
              icon={<CheckCircle className="h-5 w-5" />}
              color="text-emerald-500"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={<XCircle className="h-5 w-5" />}
              color="text-red-500"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-5 w-5" />}
              color="text-blue-500"
              subtitle={`${stats.totalSellers} sellers`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentVerifications.length === 0 ? (
                <p className="text-muted-foreground text-sm">No verifications yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentVerifications.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{v.content_title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          Score: {(v.overall_score * 100).toFixed(1)}%
                          {v.vtl_tier && ` | Trust: ${v.vtl_tier}`}
                        </p>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Failed to load stats</p>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  action,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={color}>{icon}</div>
        </div>
        {action && (
          <a href={action.href} className="text-xs text-primary hover:underline mt-2 block">
            {action.label} →
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    verified: { label: "Verified", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    manual_review: { label: "Needs Review", variant: "secondary" },
    processing: { label: "Processing", variant: "outline" },
  };
  const c = config[status] || { label: status, variant: "outline" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
