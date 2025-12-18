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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointment_links: {
        Row: {
          appointment_id: string
          created_at: string
          expires_at: string
          id: string
          purpose: string
          token: string
          used_at: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string
          expires_at: string
          id?: string
          purpose?: string
          token: string
          used_at?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_links_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_services: {
        Row: {
          appointment_id: string
          id: string
          qty: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          id?: string
          qty?: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          id?: string
          qty?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          barbershop_id: string
          client_id: string
          created_at: string
          created_by_user_id: string | null
          end_at: string
          id: string
          notes_client: string | null
          notes_internal: string | null
          payment_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          staff_user_id: string
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          total_price_estimated: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          client_id: string
          created_at?: string
          created_by_user_id?: string | null
          end_at: string
          id?: string
          notes_client?: string | null
          notes_internal?: string | null
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          staff_user_id: string
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price_estimated?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          client_id?: string
          created_at?: string
          created_by_user_id?: string | null
          end_at?: string
          id?: string
          notes_client?: string | null
          notes_internal?: string | null
          payment_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          staff_user_id?: string
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          total_price_estimated?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          barbershop_id: string
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_enabled: boolean
          open_time: string
        }
        Insert: {
          barbershop_id: string
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_enabled?: boolean
          open_time: string
        }
        Update: {
          barbershop_id?: string
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_enabled?: boolean
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          address: string | null
          booking_window_days: number
          brand_accent: string
          buffer_minutes: number
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          min_advance_hours: number
          name: string
          phone: string | null
          slot_interval_minutes: number
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_window_days?: number
          brand_accent?: string
          buffer_minutes?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_advance_hours?: number
          name: string
          phone?: string | null
          slot_interval_minutes?: number
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_window_days?: number
          brand_accent?: string
          buffer_minutes?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          min_advance_hours?: number
          name?: string
          phone?: string | null
          slot_interval_minutes?: number
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          barbershop_id: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          barbershop_id: string | null
          created_at: string
          id: string
          provider_id: string | null
          status: string
          template: string
          to_email: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          status?: string
          template: string
          to_email: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          status?: string
          template?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      paypal_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          payload_json: Json
          processed_at: string | null
          received_at: string
          status: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          payload_json: Json
          processed_at?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          payload_json?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          barbershop_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barbershop_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barbershop_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          barbershop_id: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability_rules: {
        Row: {
          barbershop_id: string
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_enabled: boolean
          open_time: string
          staff_user_id: string
        }
        Insert: {
          barbershop_id: string
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          is_enabled?: boolean
          open_time: string
          staff_user_id: string
        }
        Update: {
          barbershop_id?: string
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_enabled?: boolean
          open_time?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_rules_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          barbershop_id: string
          color_tag: string | null
          commission_rate: number | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barbershop_id: string
          color_tag?: string | null
          commission_rate?: number | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barbershop_id?: string
          color_tag?: string | null
          commission_rate?: number | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          current_period_end: string | null
          id: string
          last_payment_status: string | null
          paypal_plan_id: string | null
          paypal_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          last_payment_status?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          current_period_end?: string | null
          id?: string
          last_payment_status?: string | null
          paypal_plan_id?: string | null
          paypal_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: true
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          barbershop_id: string
          created_at: string
          end_at: string
          id: string
          reason: string | null
          staff_user_id: string | null
          start_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          end_at: string
          id?: string
          reason?: string | null
          staff_user_id?: string | null
          start_at: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          end_at?: string
          id?: string
          reason?: string | null
          staff_user_id?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_barbershop_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_belongs_to_barbershop: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
      create_barbershop_for_user: {
        Args: {
          _user_id: string
          _barbershop_name: string
          _barbershop_slug: string
        }
        Returns: string
      }
      assign_role_to_user: {
        Args: {
          _target_user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "barber" | "super_admin"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "canceled"
        | "no_show"
        | "rescheduled"
      payment_method: "cash" | "card" | "other"
      payment_status: "unpaid" | "paid"
      subscription_status:
        | "trial"
        | "active"
        | "past_due"
        | "canceled"
        | "inactive"
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
      app_role: ["owner", "manager", "barber", "super_admin"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "canceled",
        "no_show",
        "rescheduled",
      ],
      payment_method: ["cash", "card", "other"],
      payment_status: ["unpaid", "paid"],
      subscription_status: [
        "trial",
        "active",
        "past_due",
        "canceled",
        "inactive",
      ],
    },
  },
} as const
