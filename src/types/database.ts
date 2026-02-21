export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: "user" | "seller" | "admin";
          is_verified: boolean;
          seller_tier: "basic" | "pro" | "premium";
          commission_rate: number;
          stripe_account_id: string | null;
          toss_seller_id: string | null;
          total_uploads: number;
          total_sales: number;
          total_earnings: number;
          country: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "user" | "seller" | "admin";
          is_verified?: boolean;
          seller_tier?: "basic" | "pro" | "premium";
          commission_rate?: number;
          stripe_account_id?: string | null;
          toss_seller_id?: string | null;
          total_uploads?: number;
          total_sales?: number;
          total_earnings?: number;
          country?: string | null;
          language?: string;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "user" | "seller" | "admin";
          is_verified?: boolean;
          seller_tier?: "basic" | "pro" | "premium";
          commission_rate?: number;
          stripe_account_id?: string | null;
          toss_seller_id?: string | null;
          total_uploads?: number;
          total_sales?: number;
          total_earnings?: number;
          country?: string | null;
          language?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          slug: string;
          content_type: "photo" | "video" | "document" | "audio";
          original_url: string;
          preview_url: string | null;
          thumbnail_url: string | null;
          file_size: number | null;
          file_format: string | null;
          dimensions: Json | null;
          duration: number | null;
          price: number;
          currency: string;
          license_type: "personal" | "standard" | "extended" | "exclusive";
          verification_status: "pending" | "verified" | "rejected" | "unverifiable";
          verification_id: string | null;
          tags: string[];
          category: string | null;
          view_count: number;
          download_count: number;
          like_count: number;
          status: "draft" | "active" | "paused" | "removed";
          is_featured: boolean;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          slug: string;
          content_type: "photo" | "video" | "document" | "audio";
          original_url: string;
          preview_url?: string | null;
          thumbnail_url?: string | null;
          file_size?: number | null;
          file_format?: string | null;
          dimensions?: Json | null;
          duration?: number | null;
          price: number;
          currency?: string;
          license_type?: "personal" | "standard" | "extended" | "exclusive";
          verification_status?: "pending" | "verified" | "rejected" | "unverifiable";
          verification_id?: string | null;
          tags?: string[];
          category?: string | null;
          status?: "draft" | "active" | "paused" | "removed";
          is_featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          slug?: string;
          content_type?: "photo" | "video" | "document" | "audio";
          original_url?: string;
          preview_url?: string | null;
          thumbnail_url?: string | null;
          file_size?: number | null;
          file_format?: string | null;
          dimensions?: Json | null;
          duration?: number | null;
          price?: number;
          currency?: string;
          license_type?: "personal" | "standard" | "extended" | "exclusive";
          verification_status?: "pending" | "verified" | "rejected" | "unverifiable";
          verification_id?: string | null;
          tags?: string[];
          category?: string | null;
          view_count?: number;
          download_count?: number;
          like_count?: number;
          status?: "draft" | "active" | "paused" | "removed";
          is_featured?: boolean;
          meta_title?: string | null;
          meta_description?: string | null;
        };
      };
      verifications: {
        Row: {
          id: string;
          content_id: string;
          has_c2pa: boolean;
          c2pa_manifest: Json | null;
          c2pa_issuer: string | null;
          c2pa_timestamp: string | null;
          content_hash: string;
          perceptual_hash: string | null;
          exif_data: Json | null;
          device_info: Json | null;
          capture_date: string | null;
          gps_location: Json | null;
          ai_score: number | null;
          ai_detector: string | null;
          ai_details: Json | null;
          overall_score: number | null;
          status: "processing" | "verified" | "rejected" | "manual_review";
          rejection_reason: string | null;
          reviewed_by: string | null;
          provenance: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          has_c2pa?: boolean;
          c2pa_manifest?: Json | null;
          c2pa_issuer?: string | null;
          c2pa_timestamp?: string | null;
          content_hash: string;
          perceptual_hash?: string | null;
          exif_data?: Json | null;
          device_info?: Json | null;
          capture_date?: string | null;
          gps_location?: Json | null;
          ai_score?: number | null;
          ai_detector?: string | null;
          ai_details?: Json | null;
          overall_score?: number | null;
          status?: "processing" | "verified" | "rejected" | "manual_review";
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          provenance?: Json | null;
        };
        Update: {
          has_c2pa?: boolean;
          c2pa_manifest?: Json | null;
          c2pa_issuer?: string | null;
          c2pa_timestamp?: string | null;
          content_hash?: string;
          perceptual_hash?: string | null;
          exif_data?: Json | null;
          device_info?: Json | null;
          capture_date?: string | null;
          gps_location?: Json | null;
          ai_score?: number | null;
          ai_detector?: string | null;
          ai_details?: Json | null;
          overall_score?: number | null;
          status?: "processing" | "verified" | "rejected" | "manual_review";
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          provenance?: Json | null;
        };
      };
      purchases: {
        Row: {
          id: string;
          buyer_id: string;
          content_id: string;
          seller_id: string;
          amount: number;
          currency: string;
          commission_amount: number;
          seller_amount: number;
          license_type: string;
          license_key: string;
          payment_provider: "stripe" | "toss" | null;
          payment_id: string | null;
          payment_status: "pending" | "completed" | "refunded" | "failed";
          download_count: number;
          max_downloads: number;
          download_expires: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          content_id: string;
          seller_id: string;
          amount: number;
          currency?: string;
          commission_amount: number;
          seller_amount: number;
          license_type: string;
          license_key: string;
          payment_provider?: "stripe" | "toss" | null;
          payment_id?: string | null;
          payment_status?: "pending" | "completed" | "refunded" | "failed";
          download_count?: number;
          max_downloads?: number;
          download_expires?: string | null;
        };
        Update: {
          amount?: number;
          currency?: string;
          commission_amount?: number;
          seller_amount?: number;
          license_type?: string;
          payment_provider?: "stripe" | "toss" | null;
          payment_id?: string | null;
          payment_status?: "pending" | "completed" | "refunded" | "failed";
          download_count?: number;
          max_downloads?: number;
          download_expires?: string | null;
        };
      };
      payouts: {
        Row: {
          id: string;
          seller_id: string;
          amount: number;
          currency: string;
          provider: "stripe" | "toss" | "bank_transfer" | null;
          provider_payout_id: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          period_start: string;
          period_end: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          amount: number;
          currency?: string;
          provider?: "stripe" | "toss" | "bank_transfer" | null;
          provider_payout_id?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          period_start: string;
          period_end: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          provider?: "stripe" | "toss" | "bank_transfer" | null;
          provider_payout_id?: string | null;
          status?: "pending" | "processing" | "completed" | "failed";
          completed_at?: string | null;
        };
      };
      likes: {
        Row: {
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
        };
        Update: never;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          content_id: string;
          reason: "copyright" | "fake" | "inappropriate" | "spam" | "other";
          description: string | null;
          status: "open" | "investigating" | "resolved" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          content_id: string;
          reason: "copyright" | "fake" | "inappropriate" | "spam" | "other";
          description?: string | null;
          status?: "open" | "investigating" | "resolved" | "dismissed";
        };
        Update: {
          reason?: "copyright" | "fake" | "inappropriate" | "spam" | "other";
          description?: string | null;
          status?: "open" | "investigating" | "resolved" | "dismissed";
        };
      };
    };
    Functions: {
      increment_view_count: {
        Args: { content_uuid: string };
        Returns: undefined;
      };
      toggle_like: {
        Args: { p_user_id: string; p_content_id: string };
        Returns: boolean;
      };
      search_contents: {
        Args: {
          search_query: string;
          content_type_filter?: string | null;
          category_filter?: string | null;
          min_price?: number | null;
          max_price?: number | null;
          verified_only?: boolean;
          page_num?: number;
          page_size?: number;
        };
        Returns: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string;
          price: number;
          verification_status: string;
          seller_name: string;
          relevance: number;
        }[];
      };
    };
  };
}
