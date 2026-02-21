import { LICENSE_MULTIPLIERS, BUYER_FEE_RATE, DEFAULT_COMMISSION_RATE } from "@/types/payment";

export interface CommissionBreakdown {
  basePrice: number;
  licenseMultiplier: number;
  contentPrice: number;
  buyerFee: number;
  totalCharge: number;
  commissionAmount: number;
  sellerAmount: number;
}

export function calculateCommission(
  basePrice: number,
  licenseType: string,
  commissionRate: number = DEFAULT_COMMISSION_RATE
): CommissionBreakdown {
  const licenseMultiplier = LICENSE_MULTIPLIERS[licenseType] || 1.0;
  const contentPrice = basePrice * licenseMultiplier;
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
  };
}
