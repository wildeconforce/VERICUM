"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldX, Clock, Cpu } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

interface C2PADetailsProps {
  hasC2PA: boolean;
  issuer?: string | null;
  timestamp?: string | null;
  overallScore?: number | null;
  aiScore?: number | null;
  exifData?: Record<string, unknown> | null;
  deviceInfo?: Record<string, unknown> | null;
}

export function C2PADetails({
  hasC2PA,
  issuer,
  timestamp,
  overallScore,
  aiScore,
  exifData,
  deviceInfo,
}: C2PADetailsProps) {
  const t = useTranslations("verification");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {t("c2paDetails")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {hasC2PA ? (
            <Badge className="bg-emerald/10 text-emerald border-emerald/20">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {t("c2paManifestFound")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <ShieldX className="h-3 w-3 mr-1" />
              {t("noC2paManifest")}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {issuer && (
            <div>
              <p className="text-muted-foreground">{t("issuer")}</p>
              <p className="font-medium">{issuer}</p>
            </div>
          )}
          {timestamp && (
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t("timestamp")}
              </p>
              <p className="font-medium">{formatDate(timestamp)}</p>
            </div>
          )}
          {overallScore !== null && overallScore !== undefined && (
            <div>
              <p className="text-muted-foreground">{t("authenticityScore")}</p>
              <p className="font-medium text-lg">
                {(overallScore * 100).toFixed(0)}%
              </p>
            </div>
          )}
          {aiScore !== null && aiScore !== undefined && (
            <div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3" /> {t("aiDetection")}
              </p>
              <p className="font-medium">
                {t("likelyHuman", { score: ((1 - aiScore) * 100).toFixed(0) })}
              </p>
            </div>
          )}
        </div>

        {deviceInfo && typeof deviceInfo === "object" && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">{t("deviceInfo")}</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(deviceInfo)
                .filter(([, v]) => v)
                .map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {String(value)}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
