export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_analysis: {
        Row: {
          analysis_text: string
          created_at: string
          decisions: Json
          id: string
          next_version: string | null
          trade_log_id: string
        }
        Insert: {
          analysis_text: string
          created_at?: string
          decisions?: Json
          id?: string
          next_version?: string | null
          trade_log_id: string
        }
        Update: {
          analysis_text?: string
          created_at?: string
          decisions?: Json
          id?: string
          next_version?: string | null
          trade_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_analysis_trade_log_id_fkey"
            columns: ["trade_log_id"]
            isOneToOne: false
            referencedRelation: "weekly_trade_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          category: string | null
          content_type: string
          created_at: string | null
          currency: string | null
          description: string | null
          dimensions: Json | null
          download_count: number | null
          duration: number | null
          file_format: string | null
          file_size: number | null
          id: string
          is_featured: boolean | null
          license_type: string | null
          like_count: number | null
          meta_description: string | null
          meta_title: string | null
          original_url: string
          preview_url: string | null
          price: number
          seller_id: string
          slug: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          verification_id: string | null
          verification_status: string | null
          view_count: number | null
          watermark_enabled: boolean | null
        }
        Insert: {
          category?: string | null
          content_type: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dimensions?: Json | null
          download_count?: number | null
          duration?: number | null
          file_format?: string | null
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          license_type?: string | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_url: string
          preview_url?: string | null
          price: number
          seller_id: string
          slug: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          verification_id?: string | null
          verification_status?: string | null
          view_count?: number | null
          watermark_enabled?: boolean | null
        }
        Update: {
          category?: string | null
          content_type?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dimensions?: Json | null
          download_count?: number | null
          duration?: number | null
          file_format?: string | null
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          license_type?: string | null
          like_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_url?: string
          preview_url?: string | null
          price?: number
          seller_id?: string
          slug?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          verification_id?: string | null
          verification_status?: string | null
          view_count?: number | null
          watermark_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          content_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          period_end: string
          period_start: string
          provider: string | null
          provider_payout_id: string | null
          seller_id: string
          status: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          period_end: string
          period_start: string
          provider?: string | null
          provider_payout_id?: string | null
          seller_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          period_end?: string
          period_start?: string
          provider?: string | null
          provider_payout_id?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          commission_rate: number | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_verified: boolean | null
          language: string | null
          role: string | null
          seller_tier: string | null
          stripe_account_id: string | null
          toss_seller_id: string | null
          total_earnings: number | null
          total_sales: number | null
          total_uploads: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_verified?: boolean | null
          language?: string | null
          role?: string | null
          seller_tier?: string | null
          stripe_account_id?: string | null
          toss_seller_id?: string | null
          total_earnings?: number | null
          total_sales?: number | null
          total_uploads?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          language?: string | null
          role?: string | null
          seller_tier?: string | null
          stripe_account_id?: string | null
          toss_seller_id?: string | null
          total_earnings?: number | null
          total_sales?: number | null
          total_uploads?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          buyer_id: string
          commission_amount: number
          content_id: string
          created_at: string | null
          currency: string | null
          download_count: number | null
          download_expires: string | null
          id: string
          license_key: string
          license_type: string
          max_downloads: number | null
          payment_id: string | null
          payment_provider: string | null
          payment_status: string | null
          seller_amount: number
          seller_id: string
          watermark_algorithm: string | null
          watermark_status: string | null
          watermark_strength: number | null
          watermark_token: string | null
          watermark_version: number | null
          watermarked_at: string | null
          watermarked_file_key: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          commission_amount: number
          content_id: string
          created_at?: string | null
          currency?: string | null
          download_count?: number | null
          download_expires?: string | null
          id?: string
          license_key: string
          license_type: string
          max_downloads?: number | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          seller_amount: number
          seller_id: string
          watermark_algorithm?: string | null
          watermark_status?: string | null
          watermark_strength?: number | null
          watermark_token?: string | null
          watermark_version?: number | null
          watermarked_at?: string | null
          watermarked_file_key?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission_amount?: number
          content_id?: string
          created_at?: string | null
          currency?: string | null
          download_count?: number | null
          download_expires?: string | null
          id?: string
          license_key?: string
          license_type?: string
          max_downloads?: number | null
          payment_id?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          seller_amount?: number
          seller_id?: string
          watermark_algorithm?: string | null
          watermark_status?: string | null
          watermark_strength?: number | null
          watermark_token?: string | null
          watermark_version?: number | null
          watermarked_at?: string | null
          watermarked_file_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_id: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          ai_details: Json | null
          ai_detector: string | null
          ai_score: number | null
          c2pa_issuer: string | null
          c2pa_manifest: Json | null
          c2pa_timestamp: string | null
          capture_date: string | null
          content_hash: string
          content_id: string
          created_at: string | null
          device_info: Json | null
          exif_data: Json | null
          gps_location: Json | null
          has_c2pa: boolean | null
          id: string
          overall_score: number | null
          perceptual_hash: string | null
          provenance: Json | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_details?: Json | null
          ai_detector?: string | null
          ai_score?: number | null
          c2pa_issuer?: string | null
          c2pa_manifest?: Json | null
          c2pa_timestamp?: string | null
          capture_date?: string | null
          content_hash: string
          content_id: string
          created_at?: string | null
          device_info?: Json | null
          exif_data?: Json | null
          gps_location?: Json | null
          has_c2pa?: boolean | null
          id?: string
          overall_score?: number | null
          perceptual_hash?: string | null
          provenance?: Json | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_details?: Json | null
          ai_detector?: string | null
          ai_score?: number | null
          c2pa_issuer?: string | null
          c2pa_manifest?: Json | null
          c2pa_timestamp?: string | null
          capture_date?: string | null
          content_hash?: string
          content_id?: string
          created_at?: string | null
          device_info?: Json | null
          exif_data?: Json | null
          gps_location?: Json | null
          has_c2pa?: boolean | null
          id?: string
          overall_score?: number | null
          perceptual_hash?: string | null
          provenance?: Json | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_verifications_content"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_trade_logs: {
        Row: {
          bot_version: string
          created_at: string
          id: string
          loss_count: number
          symbol_stats: Json
          total_pnl: number
          total_trades: number
          week_end: string
          week_start: string
          win_count: number
        }
        Insert: {
          bot_version: string
          created_at?: string
          id?: string
          loss_count: number
          symbol_stats?: Json
          total_pnl: number
          total_trades: number
          week_end: string
          week_start: string
          win_count: number
        }
        Update: {
          bot_version?: string
          created_at?: string
          id?: string
          loss_count?: number
          symbol_stats?: Json
          total_pnl?: number
          total_trades?: number
          week_end?: string
          week_start?: string
          win_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: { content_uuid: string }
        Returns: undefined
      }
      search_contents: {
        Args: {
          category_filter?: string
          content_type_filter?: string
          max_price?: number
          min_price?: number
          page_num?: number
          page_size?: number
          search_query: string
          verified_only?: boolean
        }
        Returns: {
          description: string
          id: string
          price: number
          relevance: number
          seller_name: string
          thumbnail_url: string
          title: string
          verification_status: string
        }[]
      }
      toggle_like: {
        Args: { p_content_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
