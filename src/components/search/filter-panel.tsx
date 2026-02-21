"use client";

import { CATEGORIES, CATEGORY_LABELS, Category } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface FilterPanelProps {
  selectedCategory: string | null;
  selectedType: string | null;
  verifiedOnly: boolean;
  onCategoryChange: (category: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onVerifiedOnlyChange: (verified: boolean) => void;
  onClearAll: () => void;
}

export function FilterPanel({
  selectedCategory,
  selectedType,
  verifiedOnly,
  onCategoryChange,
  onTypeChange,
  onVerifiedOnlyChange,
  onClearAll,
}: FilterPanelProps) {
  const hasFilters = selectedCategory || selectedType || verifiedOnly;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs h-7">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium mb-2">Verification</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Verified only</span>
        </label>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium mb-2">Category</h4>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
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
      <div>
        <h4 className="text-sm font-medium mb-2">Content Type</h4>
        <div className="flex flex-wrap gap-1.5">
          {(["photo"] as const).map((type) => (
            <Badge
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() =>
                onTypeChange(selectedType === type ? null : type)
              }
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
