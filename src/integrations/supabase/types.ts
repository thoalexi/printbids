export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bid_cards: {
        Row: {
          bid_id: string
          created_at: string
          customer_id: string
          environment: string
          job_id: string
          maker_id: string
          payment_method_id: string
          status: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          customer_id: string
          environment: string
          job_id: string
          maker_id: string
          payment_method_id: string
          status?: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          customer_id?: string
          environment?: string
          job_id?: string
          maker_id?: string
          payment_method_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_cards_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          answers: string[]
          created_at: string
          design: number
          id: string
          itemized: boolean
          job_id: string
          lead_days: number
          links: string[]
          maker_id: string
          maker_name: string
          material: string
          materials: number
          notes: string
          offers: string
          photos: string[]
          post_processing: number
          printing: number
          shipping: number
          technology: string
          total: number
        }
        Insert: {
          answers?: string[]
          created_at?: string
          design?: number
          id?: string
          itemized?: boolean
          job_id: string
          lead_days: number
          links?: string[]
          maker_id: string
          maker_name?: string
          material?: string
          materials: number
          notes?: string
          offers?: string
          photos?: string[]
          post_processing?: number
          printing: number
          shipping: number
          technology?: string
          total?: number
        }
        Update: {
          answers?: string[]
          created_at?: string
          design?: number
          id?: string
          itemized?: boolean
          job_id?: string
          lead_days?: number
          links?: string[]
          maker_id?: string
          maker_name?: string
          material?: string
          materials?: number
          notes?: string
          offers?: string
          photos?: string[]
          post_processing?: number
          printing?: number
          shipping?: number
          technology?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bids_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_cards: {
        Row: {
          address: string
          email: string
          job_id: string
          method: string
          notes: string
          phone: string
          pickup_details: string
          side: string
          tracking: string
          user_id: string
        }
        Insert: {
          address?: string
          email?: string
          job_id: string
          method?: string
          notes?: string
          phone?: string
          pickup_details?: string
          side: string
          tracking?: string
          user_id: string
        }
        Update: {
          address?: string
          email?: string
          job_id?: string
          method?: string
          notes?: string
          phone?: string
          pickup_details?: string
          side?: string
          tracking?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          page: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          message: string
          page?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          page?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hire_charges: {
        Row: {
          amount_cents: number
          bid_id: string
          created_at: string
          environment: string
          job_id: string
          maker_id: string
          payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          bid_id: string
          created_at?: string
          environment: string
          job_id: string
          maker_id: string
          payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          bid_id?: string
          created_at?: string
          environment?: string
          job_id?: string
          maker_id?: string
          payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hire_charges_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_details: {
        Row: {
          ai_blocked: string | null
          description: string
          files: string[]
          job_id: string
          needs_design: boolean
          questions: string[]
          technical_answers: string[]
          technical_questions: string[]
        }
        Insert: {
          ai_blocked?: string | null
          description: string
          files?: string[]
          job_id: string
          needs_design?: boolean
          questions?: string[]
          technical_answers?: string[]
          technical_questions?: string[]
        }
        Update: {
          ai_blocked?: string | null
          description?: string
          files?: string[]
          job_id?: string
          needs_design?: boolean
          questions?: string[]
          technical_answers?: string[]
          technical_questions?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "job_details_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          job_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          job_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          job_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          awarded_maker: string | null
          bid_count: number
          budget: number | null
          category: string
          color: string
          created_at: string
          deadline: string
          delivery: string
          dimensions: string
          file_status: string
          finish: string
          fulfillment: string
          id: string
          image_key: number
          material: string
          owner_id: string
          owner_name: string
          purpose: string
          quantity: number
          region: string
          rights_confirmed: boolean
          status: string
          summary: string
          technology: string
          title: string
          verified_only: boolean
        }
        Insert: {
          awarded_maker?: string | null
          bid_count?: number
          budget?: number | null
          category?: string
          color?: string
          created_at?: string
          deadline: string
          delivery?: string
          dimensions?: string
          file_status?: string
          finish?: string
          fulfillment?: string
          id?: string
          image_key?: number
          material?: string
          owner_id: string
          owner_name?: string
          purpose?: string
          quantity: number
          region?: string
          rights_confirmed?: boolean
          status?: string
          summary?: string
          technology?: string
          title: string
          verified_only?: boolean
        }
        Update: {
          awarded_maker?: string | null
          bid_count?: number
          budget?: number | null
          category?: string
          color?: string
          created_at?: string
          deadline?: string
          delivery?: string
          dimensions?: string
          file_status?: string
          finish?: string
          fulfillment?: string
          id?: string
          image_key?: number
          material?: string
          owner_id?: string
          owner_name?: string
          purpose?: string
          quantity?: number
          region?: string
          rights_confirmed?: boolean
          status?: string
          summary?: string
          technology?: string
          title?: string
          verified_only?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          display_name: string
          id: string
          links: string[]
          materials: string[]
          printer_specs: string
          service_area: string
        }
        Insert: {
          avatar_path?: string | null
          display_name?: string
          id: string
          links?: string[]
          materials?: string[]
          printer_specs?: string
          service_area?: string
        }
        Update: {
          avatar_path?: string | null
          display_name?: string
          id?: string
          links?: string[]
          materials?: string[]
          printer_specs?: string
          service_area?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          created_at: string
          fee_paid: boolean
          id: string
          links: string[]
          materials: string[]
          photos: string[]
          printer_specs: string
          review_notes: string
          service_area: string
          shop_name: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_paid?: boolean
          id?: string
          links?: string[]
          materials: string[]
          photos?: string[]
          printer_specs: string
          review_notes?: string
          service_area?: string
          shop_name?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_paid?: boolean
          id?: string
          links?: string[]
          materials?: string[]
          photos?: string[]
          printer_specs?: string
          review_notes?: string
          service_area?: string
          shop_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_job: { Args: { target_bid: string }; Returns: undefined }
      hire_bid: { Args: { bid_id: string }; Returns: undefined }
      in_atlanta_area: { Args: { area: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      remove_job: { Args: { target: string }; Returns: undefined }
      verified_customers: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      verified_makers: {
        Args: never
        Returns: {
          user_id: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
