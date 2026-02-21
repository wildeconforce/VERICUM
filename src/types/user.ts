import { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UserRole = "user" | "seller" | "admin";
export type SellerTier = "basic" | "pro" | "premium";

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  total_uploads: number;
  total_sales: number;
  created_at: string;
}
