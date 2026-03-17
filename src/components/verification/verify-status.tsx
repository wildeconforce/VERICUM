"use client";

import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface VerifyStatusProps {
  status: "processing" | "verified" | "rejected" | "manual_review";
  score?: number;
}

const statusConfig = {
  processing: {
    icon: Loader2,
    labelKey: "verifying" as const,
    color: "text-amber",
    descKey: "processingDesc" as const,
    animate: true,
  },
  verified: {
    icon: CheckCircle,
    labelKey: "verified" as const,
    color: "text-emerald",
    descKey: "verifiedDesc" as const,
    animate: false,
  },
  rejected: {
    icon: XCircle,
    labelKey: "rejected" as const,
    color: "text-coral",
    descKey: "rejectedDesc" as const,
    animate: false,
  },
  manual_review: {
    icon: AlertCircle,
    labelKey: "underReview" as const,
    color: "text-amber",
    descKey: "reviewDesc" as const,
    animate: false,
  },
};

export function VerifyStatus({ status, score }: VerifyStatusProps) {
  const t = useTranslations("verification");
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
      <Icon
        className={`h-8 w-8 ${config.color} ${
          config.animate ? "animate-spin" : ""
        }`}
      />
      <div>
        <p className={`font-semibold ${config.color}`}>{t(config.labelKey)}</p>
        <p className="text-sm text-muted-foreground">{t(config.descKey)}</p>
        {score !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("score", { score: (score * 100).toFixed(0) })}
          </p>
        )}
      </div>
    </div>
  );
}
