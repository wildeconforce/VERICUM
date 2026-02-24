"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PriceTag } from "@/components/content/price-tag";
import { calculateCommission } from "@/lib/payment/commission";
import { LICENSE_LABELS, LICENSE_DESCRIPTIONS } from "@/lib/constants";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
  basePrice: number;
  currency: string;
  saleType?: "premium" | "royalty";
  royaltyRate?: number;
}

export function CheckoutModal({
  open,
  onOpenChange,
  contentId,
  contentTitle,
  basePrice,
  currency,
  saleType = "premium",
  royaltyRate = 0,
}: CheckoutModalProps) {
  const [selectedLicense, setSelectedLicense] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);

  const commission = calculateCommission(basePrice, selectedLicense, undefined, saleType, royaltyRate);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: contentId,
          license_type: selectedLicense,
          provider: "stripe",
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || "Failed to create checkout");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Content</DialogTitle>
          <DialogDescription>{contentTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {["personal", "standard", "extended", "exclusive"].map((license) => (
              <label
                key={license}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedLicense === license
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name="license"
                  value={license}
                  checked={selectedLicense === license}
                  onChange={(e) => setSelectedLicense(e.target.value)}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{LICENSE_LABELS[license]}</p>
                  <p className="text-xs text-muted-foreground">
                    {LICENSE_DESCRIPTIONS[license]}
                  </p>
                </div>
                <PriceTag
                  price={basePrice * (license === "personal" ? 1 : license === "standard" ? 2 : license === "extended" ? 5 : 10)}
                  currency={currency}
                  size="sm"
                />
              </label>
            ))}
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Content price</span>
              <span>{`$${commission.contentPrice.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verification fee (5%)</span>
              <span>{`$${commission.buyerFee.toFixed(2)}`}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{`$${commission.totalCharge.toFixed(2)}`}</span>
            </div>
          </div>
          <Button className="w-full" onClick={handleCheckout} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Pay ${commission.totalCharge.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
