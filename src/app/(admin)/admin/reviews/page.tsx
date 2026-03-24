"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSearch,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface ReviewItem {
  id: string;
  content_id: string;
  content_title: string;
  seller_email: string;
  overall_score: number;
  vtl_score: number | null;
  vtl_tier: string | null;
  vtl_flags: { type: string; code: string; message: string }[];
  has_c2pa: boolean;
  ai_score: number;
  ai_detector: string;
  created_at: string;
  thumbnail_url: string | null;
  c2pa_issuer: string | null;
}

export default function ManualReviewsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isAdmin, isLoading, router]);

  const loadReviews = useCallback(() => {
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAdmin) loadReviews();
  }, [isAdmin, loadReviews]);

  const handleAction = async (
    verificationId: string,
    contentId: string,
    action: "approve" | "reject"
  ) => {
    setActionInProgress(verificationId);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_id: verificationId,
          content_id: contentId,
          action,
          reason: action === "reject" ? rejectionReason : undefined,
        }),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== verificationId));
        setRejectionReason("");
        setExpandedId(null);
      }
    } catch (err) {
      console.error("Review action failed:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSearch className="h-6 w-6" />
          Manual Reviews
        </h1>
        <p className="text-muted-foreground">
          {reviews.length} item{reviews.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">All caught up!</h3>
            <p className="text-muted-foreground">No content pending manual review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((item) => {
            const isExpanded = expandedId === item.id;
            const isProcessing = actionInProgress === item.id;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {item.has_c2pa ? (
                          <Shield className="h-5 w-5 text-emerald-500" />
                        ) : (
                          "No C2PA"
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.content_title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          by {item.seller_email} | Score: {(item.overall_score * 100).toFixed(1)}%
                          {item.vtl_tier && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.vtl_tier}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.vtl_flags?.some((f) => f.type === "critical") && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/10">
                      {/* Scores grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <ScoreBox label="Overall" value={item.overall_score} />
                        <ScoreBox label="VTL Trust" value={item.vtl_score} />
                        <ScoreBox label="AI Human" value={item.ai_score} />
                        <div className="p-3 rounded-lg border text-center">
                          <p className="text-xs text-muted-foreground">C2PA</p>
                          <p className={`font-bold ${item.has_c2pa ? "text-emerald-500" : "text-muted-foreground"}`}>
                            {item.has_c2pa ? "Present" : "Absent"}
                          </p>
                        </div>
                      </div>

                      {/* VTL Flags */}
                      {item.vtl_flags && item.vtl_flags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Trust Flags</p>
                          {item.vtl_flags.map((flag, i) => (
                            <div
                              key={i}
                              className={`text-sm p-2 rounded flex items-start gap-2 ${
                                flag.type === "critical"
                                  ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : flag.type === "warning"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span><strong>{flag.code}</strong>: {flag.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* C2PA Details */}
                      {item.c2pa_issuer && (
                        <p className="text-sm text-muted-foreground">
                          C2PA Issuer: <strong>{item.c2pa_issuer}</strong>
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="space-y-3 pt-2 border-t">
                        <Textarea
                          placeholder="Rejection reason (required for reject)..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAction(item.id, item.content_id, "approve")}
                            disabled={isProcessing}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isProcessing ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleAction(item.id, item.content_id, "reject")}
                            disabled={isProcessing || !rejectionReason.trim()}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {isProcessing ? "Processing..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number | null }) {
  const pct = value != null ? (value * 100).toFixed(1) : "N/A";
  const color = value == null ? "" : value >= 0.7 ? "text-emerald-500" : value >= 0.4 ? "text-amber-500" : "text-red-500";
  return (
    <div className="p-3 rounded-lg border text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-bold ${color}`}>{pct}{value != null ? "%" : ""}</p>
    </div>
  );
}
