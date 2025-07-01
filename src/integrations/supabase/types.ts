export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          chain: string
          id: string
          issued_at: string | null
          metadata: Json
          type: string
          user_id: string | null
        }
        Insert: {
          chain: string
          id?: string
          issued_at?: string | null
          metadata: Json
          type: string
          user_id?: string | null
        }
        Update: {
          chain?: string
          id?: string
          issued_at?: string | null
          metadata?: Json
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          created_at: string | null
          dapp_id: string | null
          feedback: string
          id: string
          rating: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dapp_id?: string | null
          feedback: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dapp_id?: string | null
          feedback?: string
          id?: string
          rating?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_feedback_dapp_id_fkey"
            columns: ["dapp_id"]
            isOneToOne: false
            referencedRelation: "dapps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dapp_submissions: {
        Row: {
          category: string
          chain: string
          created_at: string | null
          description: string | null
          id: string
          logo: string | null
          name: string
          status: string | null
          url: string
          user_id: string | null
          video: string | null
        }
        Insert: {
          category: string
          chain: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          status?: string | null
          url: string
          user_id?: string | null
          video?: string | null
        }
        Update: {
          category?: string
          chain?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          status?: string | null
          url?: string
          user_id?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dapp_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dapps: {
        Row: {
          analytics: Json | null
          category: string
          chain: string
          created_at: string | null
          description: string | null
          id: string
          logo: string | null
          name: string
          reactions: number | null
          url: string
          user_id: string | null
          video: string | null
        }
        Insert: {
          analytics?: Json | null
          category: string
          chain: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          reactions?: number | null
          url: string
          user_id?: string | null
          video?: string | null
        }
        Update: {
          analytics?: Json | null
          category?: string
          chain?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          reactions?: number | null
          url?: string
          user_id?: string | null
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dapps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json
          id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          id?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          location: string | null
          preferences: Json | null
          username: string | null
          wallet_address: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          preferences?: Json | null
          username?: string | null
          wallet_address: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          preferences?: Json | null
          username?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
