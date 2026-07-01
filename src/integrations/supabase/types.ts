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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          doctor_id: string
          duration_minutes: number
          id: string
          location_address: string | null
          location_coords: string | null
          location_name: string | null
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_coords?: string | null
          location_name?: string | null
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          duration_minutes?: number
          id?: string
          location_address?: string | null
          location_coords?: string | null
          location_name?: string | null
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          callee_id: string | null
          callee_name: string | null
          caller_id: string
          caller_name: string | null
          connected_at: string | null
          created_at: string
          duration_seconds: number
          ended_at: string | null
          group_id: string | null
          id: string
          room_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          callee_id?: string | null
          callee_name?: string | null
          caller_id: string
          caller_name?: string | null
          connected_at?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          group_id?: string | null
          id?: string
          room_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          callee_id?: string | null
          callee_name?: string | null
          caller_id?: string
          caller_name?: string | null
          connected_at?: string | null
          created_at?: string
          duration_seconds?: number
          ended_at?: string | null
          group_id?: string | null
          id?: string
          room_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          edited_at: string | null
          file_name: string | null
          file_url: string | null
          forwarded_from: string | null
          id: string
          image_url: string | null
          is_deleted: boolean
          is_edited: boolean
          is_pinned: boolean
          is_read: boolean
          message: string | null
          read_at: string | null
          receiver_id: string
          reply_to: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          file_name?: string | null
          file_url?: string | null
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          receiver_id: string
          reply_to?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          file_name?: string | null
          file_url?: string | null
          forwarded_from?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          receiver_id?: string
          reply_to?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_forwarded_from_fkey"
            columns: ["forwarded_from"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean
          message: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean
          message: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean
          message?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          ai_model: string | null
          blood_results: string | null
          complaint: string | null
          condition_name: string | null
          confidence: number | null
          created_at: string
          description: string | null
          id: string
          lifestyle_tips: Json | null
          medications: Json | null
          mri_summary: string | null
          patient_id: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          blood_results?: string | null
          complaint?: string | null
          condition_name?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          id?: string
          lifestyle_tips?: Json | null
          medications?: Json | null
          mri_summary?: string | null
          patient_id?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          blood_results?: string | null
          complaint?: string | null
          condition_name?: string | null
          confidence?: number | null
          created_at?: string
          description?: string | null
          id?: string
          lifestyle_tips?: Json | null
          medications?: Json | null
          mri_summary?: string | null
          patient_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          available_date: string | null
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          location_address: string | null
          location_coords: string | null
          location_name: string | null
          slot_minutes: number
          start_time: string
          weekday: number
        }
        Insert: {
          available_date?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          location_address?: string | null
          location_coords?: string | null
          location_name?: string | null
          slot_minutes?: number
          start_time: string
          weekday: number
        }
        Update: {
          available_date?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          location_address?: string | null
          location_coords?: string | null
          location_name?: string | null
          slot_minutes?: number
          start_time?: string
          weekday?: number
        }
        Relationships: []
      }
      doctor_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          doctor_id: string
          id: string
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          doctor_id: string
          id?: string
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          id?: string
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_patients: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "doctor_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          group_id: string
          id: string
          image_url: string | null
          is_deleted: boolean
          message: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          message?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          message?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "doctor_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_invitations: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          dosage: string | null
          duration: string | null
          id: string
          instructions: string | null
          medication: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          dosage?: string | null
          duration?: string | null
          id?: string
          instructions?: string | null
          medication: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          dosage?: string | null
          duration?: string | null
          id?: string
          instructions?: string | null
          medication?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_ai_count: number
          daily_ai_date: string
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean
          role: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_ai_count?: number
          daily_ai_date?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_ai_count?: number
          daily_ai_date?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          role?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rehab_sessions: {
        Row: {
          accuracy_score: number | null
          completed_reps: number | null
          created_at: string
          duration_seconds: number | null
          exercise_name: string
          feedback_log: Json | null
          id: string
          patient_id: string | null
          total_reps: number | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          completed_reps?: number | null
          created_at?: string
          duration_seconds?: number | null
          exercise_name: string
          feedback_log?: Json | null
          id?: string
          patient_id?: string | null
          total_reps?: number | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          completed_reps?: number | null
          created_at?: string
          duration_seconds?: number | null
          exercise_name?: string
          feedback_log?: Json | null
          id?: string
          patient_id?: string | null
          total_reps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rehab_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_analyses: {
        Row: {
          ai_model: string | null
          created_at: string
          findings: Json | null
          id: string
          image_url: string | null
          patient_id: string | null
          recommendation: string | null
          scan_type: string | null
          severity: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          image_url?: string | null
          patient_id?: string | null
          recommendation?: string | null
          scan_type?: string | null
          severity?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          findings?: Json | null
          id?: string
          image_url?: string | null
          patient_id?: string | null
          recommendation?: string | null
          scan_type?: string | null
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_analyses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_booked_slots: {
        Args: { _day: string; _doctor_id: string }
        Returns: {
          duration_minutes: number
          scheduled_at: string
        }[]
      }
      get_doctor_patient_counts: {
        Args: never
        Returns: {
          doctor_id: string
          patient_count: number
        }[]
      }
      get_public_doctors: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          specialty: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: { _user_id: string }; Returns: boolean }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      log_admin_access_attempt: {
        Args: { _details?: Json; _entity_id: string; _entity_type: string }
        Returns: undefined
      }
      record_call_status: {
        Args: { _call_id: string; _status: string }
        Returns: undefined
      }
      search_users_by_email: {
        Args: { search_email: string }
        Returns: {
          avatar_url: string | null
          created_at: string
          daily_ai_count: number
          daily_ai_date: string
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean
          role: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      toggle_pin_message: {
        Args: { _message_id: string; _pin: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "doctor" | "patient"
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
      app_role: ["admin", "moderator", "user", "doctor", "patient"],
    },
  },
} as const
