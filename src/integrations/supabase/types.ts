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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cadastre_servitudes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          present: boolean
          project_id: string
          type: string
          type_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          present?: boolean
          project_id: string
          type: string
          type_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          present?: boolean
          project_id?: string
          type?: string
          type_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      existing_values: {
        Row: {
          abatt: number | null
          created_at: string | null
          dvf: number | null
          etat: number | null
          id: string
          notes: string | null
          parcel_code: string | null
          parcel_section: string | null
          price_m2: number | null
          price_unit: number | null
          project_id: string
          surface_or_count: number | null
          tcap: number | null
          type: string
        }
        Insert: {
          abatt?: number | null
          created_at?: string | null
          dvf?: number | null
          etat?: number | null
          id?: string
          notes?: string | null
          parcel_code?: string | null
          parcel_section?: string | null
          price_m2?: number | null
          price_unit?: number | null
          project_id: string
          surface_or_count?: number | null
          tcap?: number | null
          type: string
        }
        Update: {
          abatt?: number | null
          created_at?: string | null
          dvf?: number | null
          etat?: number | null
          id?: string
          notes?: string | null
          parcel_code?: string | null
          parcel_section?: string | null
          price_m2?: number | null
          price_unit?: number | null
          project_id?: string
          surface_or_count?: number | null
          tcap?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "existing_values_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fiches: {
        Row: {
          address: string
          cadastre_number: string
          cadastre_section: string
          completion: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          cadastre_number: string
          cadastre_section: string
          completion?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          cadastre_number?: string
          cadastre_section?: string
          completion?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      land_recaps: {
        Row: {
          created_at: string
          id: string
          notes: string
          occupation_type: string
          owner_name: string
          owner_status: string
          parcel_id: string | null
          parcelle: string | null
          project_id: string
          resident_status: string
          section: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          occupation_type?: string
          owner_name?: string
          owner_status?: string
          parcel_id?: string | null
          parcelle?: string | null
          project_id: string
          resident_status?: string
          section?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          occupation_type?: string
          owner_name?: string
          owner_status?: string
          parcel_id?: string | null
          parcelle?: string | null
          project_id?: string
          resident_status?: string
          section?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plu_servitudes: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          project_id: string
          type_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          type_key: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          type_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "plu_servitudes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          org_id: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          org_id?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          org_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string | null
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recapitulatif_foncier_rows: {
        Row: {
          additional_info: string
          cadastre_id: string
          created_at: string
          fiche_id: string
          id: string
          occupation_type: string
          owner_details: string
          owner_status: string
          parcelle: string | null
          resident_status: string
          section: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string
          cadastre_id?: string
          created_at?: string
          fiche_id: string
          id?: string
          occupation_type?: string
          owner_details?: string
          owner_status?: string
          parcelle?: string | null
          resident_status?: string
          section?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string
          cadastre_id?: string
          created_at?: string
          fiche_id?: string
          id?: string
          occupation_type?: string
          owner_details?: string
          owner_status?: string
          parcelle?: string | null
          resident_status?: string
          section?: string | null
          updated_at?: string
          user_id?: string
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
