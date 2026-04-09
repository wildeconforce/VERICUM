"use client";

import { LICENSE_LABELS, LICENSE_DESCRIPTIONS } from "@/lib/constants";
import { LICENSE_MULTIPLIERS } from "@/types/payment";
import { formatPrice } from "@/lib/utils/format";

interface PriceSelectorProps {
  basePrice: number;
  currency?: string;
  selectedLicense: string;
  onSelect: (license: string) => void;
}

export function PriceSelector({
  basePrice,
  currency = "USD",
  selectedLicense,
  onSelect,
}: PriceSelectorProps) {
  const licenses = ["personal", "standard", "extended"];

  return (
    <div className="space-y-2">
      {licenses.map((license) => {
        const multiplier = LICENSE_MULTIPLIERS[license];
        const price = basePrice * multiplier;
        const isSelected = selectedLicense === license;

        return (
          <label
            key={license}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="license"
                value={license}
                checked={isSelected}
                onChange={() => onSelect(license)}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{LICENSE_LABELS[license]}</p>
                <p className="text-xs text-muted-foreground">
                  {LICENSE_DESCRIPTIONS[license]}
                </p>
              </div>
            </div>
            <span className="font-semibold text-sm">
              {formatPrice(price, currency)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
