import {
  LICENSE_MULTIPLIERS,
  BUYER_FEE_RATE,
  DEFAULT_COMMISSION_RATE,
  ROYALTY_PRICE_DISCOUNT,
} from "@/types/payment";

export interface CommissionBreakdown {
  basePrice: number;
  licenseMultiplier: number;
  contentPrice: number;
  buyerFee: number;
  totalCharge: number;
  commissionAmount: number;
  sellerAmount: number;
  saleType: "premium" | "royalty";
  royaltyRate: number;
}

export function calculateCommission(
  basePrice: number,
  licenseType: string,
  commissionRate: number = DEFAULT_COMMISSION_RATE,
  saleType: "premium" | "royalty" = "premium",
  royaltyRate: number = 0
): CommissionBreakdown {
  const licenseMultiplier = LICENSE_MULTIPLIERS[licenseType] || 1.0;
  let contentPrice = basePrice * licenseMultiplier;

  // Royalty sales are discounted
  if (saleType === "royalty") {
    contentPrice = contentPrice * ROYALTY_PRICE_DISCOUNT;
  }

  const buyerFee = contentPrice * BUYER_FEE_RATE;
  const totalCharge = contentPrice + buyerFee;
  const commissionAmount = contentPrice * commissionRate + buyerFee;
  const sellerAmount = contentPrice * (1 - commissionRate);

  return {
    basePrice,
    licenseMultiplier,
    contentPrice: Math.round(contentPrice * 100) / 100,
    buyerFee: Math.round(buyerFee * 100) / 100,
    totalCharge: Math.round(totalCharge * 100) / 100,
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    sellerAmount: Math.round(sellerAmount * 100) / 100,
    saleType,
    royaltyRate,
  };
}
