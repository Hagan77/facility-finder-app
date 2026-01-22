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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      facilities: {
        Row: {
          created_at: string
          district: string | null
          effective_date: string | null
          expiry_date: string | null
          file_location_id: string | null
          id: number
          location: string | null
          name: string | null
          office_id: string | null
          region_id: string | null
          sector: Database["public"]["Enums"]["sector_type"] | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          file_location_id?: string | null
          id?: number
          location?: string | null
          name?: string | null
          office_id?: string | null
          region_id?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
        }
        Update: {
          created_at?: string
          district?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          file_location_id?: string | null
          id?: number
          location?: string | null
          name?: string | null
          office_id?: string | null
          region_id?: string | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          created_at: string
          id: string
          office_name: string
          region_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_name: string
          region_id: string
        }
        Update: {
          created_at?: string
          id?: string
          office_name?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offices_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          category: string | null
          created_at: string
          id: string
          location: string
          name: string
          office_id: string | null
          payment_date: string
          region_id: string | null
          sector: string | null
        }
        Insert: {
          amount_paid: number
          category?: string | null
          created_at?: string
          id?: string
          location: string
          name: string
          office_id?: string | null
          payment_date: string
          region_id?: string | null
          sector?: string | null
        }
        Update: {
          amount_paid?: number
          category?: string | null
          created_at?: string
          id?: string
          location?: string
          name?: string
          office_id?: string | null
          payment_date?: string
          region_id?: string | null
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          sector: Database["public"]["Enums"]["sector_type"] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_sector: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["sector_type"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sector_head" | "user"
      sector_type:
        | "hospitality"
        | "health"
        | "mining"
        | "infrastructure"
        | "education"
        | "agriculture"
        | "manufacturing"
        | "tourism"
        | "finance"
        | "transportation"
        | "energy"
        | "chemicals"
        | "telecommunication"
        | "quarry"
        | "QUARRY"
        | "MANUFACTURING"
        | "INFRASTRUCTURE"
        | "ENERGY"
        | "HEALTH"
        | "HOSPITALITY"
        | "MINING"
        | "SMALL SCALE MINING"
        | "small scale mining"
        | "mines and quarry"
        | "chemicals & Pesticide"
        | "chemicals & pesticide"
        | "chemicals & pesticides"
        | "AGRICULTURE"
        | "TELECOMMUNICATION"
        | "CHEMICALS & PESTICIDE"
        | "Manufacturing"
        | "HHOSPITALITY"
        | "HHospitlity"
        | "MINES AND QUARRY"
        | " MINING"
        | " Mining"
        | " Infrastructure"
        | "Infrastructure"
        | "Hospitality"
        | "IINFRASTRUCTURE"
        | "Mining"
        | " CHEMICALS & PESTICIDE"
        | "CHEMICALS & PESTICIDE "
        | "Chemicals & Pesticides"
        | "Chemicals & Pesticides "
        | " Chemicals & Pesticides"
        | "Agriculture"
        | " Agriculture"
        | " Agriculture "
        | "N"
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
    Enums: {
      app_role: ["admin", "sector_head", "user"],
      sector_type: [
        "hospitality",
        "health",
        "mining",
        "infrastructure",
        "education",
        "agriculture",
        "manufacturing",
        "tourism",
        "finance",
        "transportation",
        "energy",
        "chemicals",
        "telecommunication",
        "quarry",
        "QUARRY",
        "MANUFACTURING",
        "INFRASTRUCTURE",
        "ENERGY",
        "HEALTH",
        "HOSPITALITY",
        "MINING",
        "SMALL SCALE MINING",
        "small scale mining",
        "mines and quarry",
        "chemicals & Pesticide",
        "chemicals & pesticide",
        "chemicals & pesticides",
        "AGRICULTURE",
        "TELECOMMUNICATION",
        "CHEMICALS & PESTICIDE",
        "Manufacturing",
        "HHOSPITALITY",
        "HHospitlity",
        "MINES AND QUARRY",
        " MINING",
        " Mining",
        " Infrastructure",
        "Infrastructure",
        "Hospitality",
        "IINFRASTRUCTURE",
        "Mining",
        " CHEMICALS & PESTICIDE",
        "CHEMICALS & PESTICIDE ",
        "Chemicals & Pesticides",
        "Chemicals & Pesticides ",
        " Chemicals & Pesticides",
        "Agriculture",
        " Agriculture",
        " Agriculture ",
        "N",
      ],
    },
  },
} as const
