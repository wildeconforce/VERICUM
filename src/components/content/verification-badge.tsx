import { cn } from "@/lib/utils";
import { ShieldCheck, Clock, ShieldX, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VerificationBadgeProps {
  status: "verified" | "pending" | "rejected" | "unverifiable";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const config = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-emerald/10 text-emerald border-emerald/20 hover:bg-emerald/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber/10 text-amber border-amber/20 hover:bg-amber/20",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldX,
    className: "bg-coral/10 text-coral border-coral/20 hover:bg-coral/20",
  },
  unverifiable: {
    label: "Unverifiable",
    icon: ShieldQuestion,
    className: "bg-muted text-muted-foreground border-muted hover:bg-muted/80",
  },
};

const sizes = {
  sm: { icon: "h-3 w-3", text: "text-xs", padding: "px-1.5 py-0.5" },
  md: { icon: "h-4 w-4", text: "text-sm", padding: "px-2 py-1" },
  lg: { icon: "h-5 w-5", text: "text-base", padding: "px-3 py-1.5" },
};

export function VerificationBadge({
  status,
  size = "md",
  showLabel = true,
}: VerificationBadgeProps) {
  const { label, icon: Icon, className } = config[status];
  const s = sizes[size];

  return (
    <Badge variant="outline" className={cn(className, s.padding, "gap-1 font-medium")}>
      <Icon className={s.icon} />
      {showLabel && <span className={s.text}>{label}</span>}
    </Badge>
  );
}
