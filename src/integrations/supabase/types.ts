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
      bids: {
        Row: {
          answers: string[]
          created_at: string
          id: string
          job_id: string
          lead_days: number
          maker_id: string
          materials: number
          notes: string
          printing: number
          shipping: number
        }
        Insert: {
          answers?: string[]
          created_at?: string
          id?: string
          job_id: string
          lead_days: number
          maker_id: string
          materials: number
          notes?: string
          printing: number
          shipping: number
        }
        Update: {
          answers?: string[]
          created_at?: string
          id?: string
          job_id?: string
          lead_days?: number
          maker_id?: string
          materials?: number
          notes?: string
          printing?: number
          shipping?: number
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
          notes: string
          phone: string
          side: string
          tracking: string
          user_id: string
        }
        Insert: {
          address?: string
          email?: string
          job_id: string
          notes?: string
          phone?: string
          side: string
          tracking?: string
          user_id: string
        }
        Update: {
          address?: string
          email?: string
          job_id?: string
          notes?: string
          phone?: string
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
      jobs: {
        Row: {
          awarded_maker: string | null
          bid_count: number
          budget: number | null
          created_at: string
          deadline: string
          fulfillment: string
          id: string
          image_key: number
          material: string
          owner_id: string
          quantity: number
          region: string
          status: string
          summary: string
          technology: string
          title: string
        }
        Insert: {
          awarded_maker?: string | null
          bid_count?: number
          budget?: number | null
          created_at?: string
          deadline: string
          fulfillment?: string
          id?: string
          image_key?: number
          material?: string
          owner_id: string
          quantity: number
          region?: string
          status?: string
          summary?: string
          technology?: string
          title: string
        }
        Update: {
          awarded_maker?: string | null
          bid_count?: number
          budget?: number | null
          created_at?: string
          deadline?: string
          fulfillment?: string
          id?: string
          image_key?: number
          material?: string
          owner_id?: string
          quantity?: number
          region?: string
          status?: string
          summary?: string
          technology?: string
          title?: string
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
        }
        Insert: {
          avatar_path?: string | null
          display_name?: string
          id: string
          links?: string[]
          materials?: string[]
          printer_specs?: string
        }
        Update: {
          avatar_path?: string | null
          display_name?: string
          id?: string
          links?: string[]
          materials?: string[]
          printer_specs?: string
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
          id: string
          links: string[]
          materials: string[]
          photos: string[]
          printer_specs: string
          review_notes: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          links?: string[]
          materials: string[]
          photos?: string[]
          printer_specs: string
          review_notes?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          links?: string[]
          materials?: string[]
          photos?: string[]
          printer_specs?: string
          review_notes?: string
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
      hire_bid: { Args: { bid_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
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
