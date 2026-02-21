import { Database } from "./database";

export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type PurchaseInsert = Database["public"]["Tables"]["purchases"]["Insert"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];

export type PaymentProvider = "stripe" | "toss";
export type PaymentStatus = "pending" | "completed" | "refunded" | "failed";

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

export const LICENSE_MULTIPLIERS: Record<string, number> = {
  personal: 1.0,
  standard: 2.0,
  extended: 5.0,
  exclusive: 10.0,
};

export const BUYER_FEE_RATE = 0.05;
export const DEFAULT_COMMISSION_RATE = 0.20;
