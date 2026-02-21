import { formatPrice } from "@/lib/utils/format";
import { LICENSE_LABELS } from "@/lib/constants";

interface PriceTagProps {
  price: number;
  currency?: string;
  licenseType?: string;
  showLicense?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({
  price,
  currency = "USD",
  licenseType,
  showLicense = false,
  size = "md",
}: PriceTagProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <div className="flex flex-col">
      <span className={`font-semibold ${sizeClasses[size]}`}>
        {formatPrice(price, currency)}
      </span>
      {showLicense && licenseType && (
        <span className="text-xs text-muted-foreground">
          {LICENSE_LABELS[licenseType]}
        </span>
      )}
    </div>
  );
}
