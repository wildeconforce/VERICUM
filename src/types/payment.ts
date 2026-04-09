import { Database } from "./database";

export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];

export type PaymentProvider = "stripe" | "toss";
export type PaymentStatus = "pending" | "completed" | "refunded" | "failed";
export type SaleType = "premium" | "royalty";

export interface CheckoutRequest {
  content_id: string;
  license_type: "personal" | "standard" | "extended" | "exclusive";
  provider: PaymentProvider;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface EarningsSummary {
  total_earnings: number;
  pending_payout: number;
  last_payout: number;
  sales_count: number;
  chart_data: { date: string; amount: number }[];
}

export interface ContentSaleStats {
  content_id: string;
  title: string;
  thumbnail_url: string | null;
  total_sales: number;
  total_revenue: number;
  view_count: number;
  download_count: number;
}

export const LICENSE_MULTIPLIERS: Record<string, number> = {
  personal: 1.0,
  standard: 2.0,
  extended: 5.0,
  exclusive: 10.0,
};

// 15% commission from both sides (buyer + seller)
export const BUYER_FEE_RATE = 0.15;
export const DEFAULT_COMMISSION_RATE = 0.15;

// Sale type: Premium (expensive, no secondary royalties) vs Royalty (cheaper, 5-10% royalty)
export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  premium: "Premium Sale",
  royalty: "Royalty Sale",
};

export const SALE_TYPE_DESCRIPTIONS: Record<SaleType, string> = {
  premium: "Higher price, no secondary creation royalties. Buyer gets full usage rights.",
  royalty: "Lower price with royalty on secondary creations.",
};

export const DEFAULT_ROYALTY_RATE = 0.05;
export const MAX_ROYALTY_RATE = 0.10;
export const ROYALTY_PRICE_DISCOUNT = 0.6;
