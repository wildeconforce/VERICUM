"use client";

import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface VerifyStatusProps {
  status: "processing" | "verified" | "rejected" | "manual_review";
  score?: number;
}

const statusConfig = {
  processing: {
    icon: Loader2,
    label: "Verifying...",
    color: "text-amber",
    description: "Running C2PA verification engine",
    animate: true,
  },
  verified: {
    icon: CheckCircle,
    label: "Verified",
    color: "text-emerald",
    description: "Content passed all verification checks",
    animate: false,
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "text-coral",
    description: "Content did not pass verification",
    animate: false,
  },
  manual_review: {
    icon: AlertCircle,
    label: "Under Review",
    color: "text-amber",
    description: "Content requires manual review",
    animate: false,
  },
};

export function VerifyStatus({ status, score }: VerifyStatusProps) {
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
        <p className={`font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        {score !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Score: {(score * 100).toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  );
}
