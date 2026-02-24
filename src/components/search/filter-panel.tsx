"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CATEGORIES, CATEGORY_LABELS, Category, CONTENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Camera, Video, FileText, Music } from "lucide-react";

interface FilterPanelProps {
  selectedCategory: string | null;
  selectedType: string | null;
  verifiedOnly: boolean;
  minPrice?: number | null;
  maxPrice?: number | null;
  onCategoryChange: (category: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onVerifiedOnlyChange: (verified: boolean) => void;
  onPriceChange?: (min: number | null, max: number | null) => void;
  onClearAll: () => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  photo: <Camera className="h-3 w-3" />,
  video: <Video className="h-3 w-3" />,
  document: <FileText className="h-3 w-3" />,
  audio: <Music className="h-3 w-3" />,
};

export function FilterPanel({
  selectedCategory,
  selectedType,
  verifiedOnly,
  minPrice,
  maxPrice,
  onCategoryChange,
  onTypeChange,
  onVerifiedOnlyChange,
  onPriceChange,
  onClearAll,
}: FilterPanelProps) {
  const t = useTranslations("explore.filters");
  const hasFilters = selectedCategory || selectedType || verifiedOnly || minPrice || maxPrice;
  const [localMin, setLocalMin] = useState(minPrice?.toString() || "");
  const [localMax, setLocalMax] = useState(maxPrice?.toString() || "");

  const handlePriceApply = () => {
    onPriceChange?.(
      localMin ? parseFloat(localMin) : null,
      localMax ? parseFloat(localMax) : null
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{t("title")}</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs h-7">
            <X className="h-3 w-3 mr-1" />
            {t("clearAll")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Verification filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{t("verification")}</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-sm">{t("verifiedOnly")}</span>
        </label>
      </div>

      <Separator />

      {/* Category filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{t("category")}</h4>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() =>
                onCategoryChange(selectedCategory === cat ? null : cat)
              }
            >
              {CATEGORY_LABELS[cat as Category]}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Content Type filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{t("contentType")}</h4>
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPES.map((type) => (
            <Badge
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="cursor-pointer capitalize text-xs"
              onClick={() =>
                onTypeChange(selectedType === type ? null : type)
              }
            >
              {TYPE_ICONS[type]}
              <span className="ml-1">{type}</span>
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{t("priceRange")}</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">{t("minPrice")}</Label>
            <Input
              type="number"
              placeholder="$0"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="h-8 text-sm"
              min={0}
            />
          </div>
          <span className="text-muted-foreground mt-4">-</span>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">{t("maxPrice")}</Label>
            <Input
              type="number"
              placeholder="$999"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="h-8 text-sm"
              min={0}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2 text-xs h-7"
          onClick={handlePriceApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
