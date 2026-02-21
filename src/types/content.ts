import { Database } from "./database";

export type Content = Database["public"]["Tables"]["contents"]["Row"];
export type ContentInsert = Database["public"]["Tables"]["contents"]["Insert"];
export type ContentUpdate = Database["public"]["Tables"]["contents"]["Update"];

export type ContentType = "photo" | "video" | "document" | "audio";
export type ContentStatus = "draft" | "active" | "paused" | "removed";
export type VerificationStatus = "pending" | "verified" | "rejected" | "unverifiable";
export type LicenseType = "personal" | "standard" | "extended" | "exclusive";

export interface ContentWithSeller extends Content {
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface ContentDetail extends Content {
  profiles: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    total_sales: number;
  };
  verifications: {
    id: string;
    has_c2pa: boolean;
    c2pa_issuer: string | null;
    c2pa_timestamp: string | null;
    overall_score: number | null;
    status: string;
    provenance: unknown;
    exif_data: unknown;
    device_info: unknown;
    ai_score: number | null;
  } | null;
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  category?: string;
  type?: ContentType;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
  verified_only?: boolean;
}

export interface ContentListResponse {
  data: ContentWithSeller[];
  total: number;
  page: number;
  total_pages: number;
}
