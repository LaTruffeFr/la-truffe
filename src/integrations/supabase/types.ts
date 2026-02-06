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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      beta_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      garage_billing: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_billing_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: true
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_members: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_members_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garages: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_payments: {
        Row: {
          credits: number
          id: string
          processed_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          credits: number
          id?: string
          processed_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          credits?: number
          id?: string
          processed_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits: number
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          annee: number | null
          annee_max: number | null
          annee_min: number | null
          carburant: string | null
          created_at: string
          decote_par_10k: number | null
          economie_moyenne: number | null
          expert_opinion: string | null
          id: string
          kilometrage: number | null
          kilometrage_max: number | null
          lien_annonce: string | null
          market_data: Json | null
          marque: string
          modele: string
          negotiation_arguments: string | null
          notes: string | null
          opportunites_count: number | null
          prix_affiche: number | null
          prix_estime: number | null
          prix_max: number | null
          prix_moyen: number | null
          prix_truffe: number | null
          report_url: string | null
          share_token: string | null
          status: Database["public"]["Enums"]["report_status"]
          total_vehicules: number | null
          transmission: string | null
          updated_at: string
          user_id: string
          vehicles_data: Json | null
        }
        Insert: {
          admin_notes?: string | null
          annee?: number | null
          annee_max?: number | null
          annee_min?: number | null
          carburant?: string | null
          created_at?: string
          decote_par_10k?: number | null
          economie_moyenne?: number | null
          expert_opinion?: string | null
          id?: string
          kilometrage?: number | null
          kilometrage_max?: number | null
          lien_annonce?: string | null
          market_data?: Json | null
          marque: string
          modele: string
          negotiation_arguments?: string | null
          notes?: string | null
          opportunites_count?: number | null
          prix_affiche?: number | null
          prix_estime?: number | null
          prix_max?: number | null
          prix_moyen?: number | null
          prix_truffe?: number | null
          report_url?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          total_vehicules?: number | null
          transmission?: string | null
          updated_at?: string
          user_id: string
          vehicles_data?: Json | null
        }
        Update: {
          admin_notes?: string | null
          annee?: number | null
          annee_max?: number | null
          annee_min?: number | null
          carburant?: string | null
          created_at?: string
          decote_par_10k?: number | null
          economie_moyenne?: number | null
          expert_opinion?: string | null
          id?: string
          kilometrage?: number | null
          kilometrage_max?: number | null
          lien_annonce?: string | null
          market_data?: Json | null
          marque?: string
          modele?: string
          negotiation_arguments?: string | null
          notes?: string | null
          opportunites_count?: number | null
          prix_affiche?: number | null
          prix_estime?: number | null
          prix_max?: number | null
          prix_moyen?: number | null
          prix_truffe?: number | null
          report_url?: string | null
          share_token?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          total_vehicules?: number | null
          transmission?: string | null
          updated_at?: string
          user_id?: string
          vehicles_data?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          annee: number | null
          carburant: string | null
          created_at: string
          gain_potentiel: number | null
          garage_id: string | null
          id: string
          image: string | null
          kilometrage: number
          lien: string | null
          localisation: string | null
          marque: string
          modele: string
          prix: number
          prix_ajuste: number | null
          prix_median_segment: number | null
          puissance: number | null
          score_confiance: number | null
          titre: string
          transmission: string | null
        }
        Insert: {
          annee?: number | null
          carburant?: string | null
          created_at?: string
          gain_potentiel?: number | null
          garage_id?: string | null
          id?: string
          image?: string | null
          kilometrage?: number
          lien?: string | null
          localisation?: string | null
          marque: string
          modele: string
          prix: number
          prix_ajuste?: number | null
          prix_median_segment?: number | null
          puissance?: number | null
          score_confiance?: number | null
          titre: string
          transmission?: string | null
        }
        Update: {
          annee?: number | null
          carburant?: string | null
          created_at?: string
          gain_potentiel?: number | null
          garage_id?: string | null
          id?: string
          image?: string | null
          kilometrage?: number
          lien?: string | null
          localisation?: string | null
          marque?: string
          modele?: string
          prix?: number
          prix_ajuste?: number | null
          prix_median_segment?: number | null
          puissance?: number | null
          score_confiance?: number | null
          titre?: string
          transmission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      garage_has_subscription: {
        Args: { _garage_id: string }
        Returns: boolean
      }
      generate_share_token: { Args: never; Returns: string }
      get_user_garage_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_garage_member: {
        Args: { _garage_id: string; _user_id: string }
        Returns: boolean
      }
      is_garage_owner: {
        Args: { _garage_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      report_status: "pending" | "in_progress" | "completed"
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
      app_role: ["admin", "user"],
      report_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
