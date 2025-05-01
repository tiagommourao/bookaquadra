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
      achievement_types: {
        Row: {
          category: string
          conditions: Json | null
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points: number
          updated_at: string
        }
        Insert: {
          category: string
          conditions?: Json | null
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points?: number
          updated_at?: string
        }
        Update: {
          category?: string
          conditions?: Json | null
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount: number
          booking_date: string
          court_id: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          is_monthly: boolean | null
          notes: string | null
          payment_status: string
          start_time: string
          status: string
          subscription_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_date: string
          court_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          is_monthly?: boolean | null
          notes?: string | null
          payment_status: string
          start_time: string
          status: string
          subscription_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_date?: string
          court_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          is_monthly?: boolean | null
          notes?: string | null
          payment_status?: string
          start_time?: string
          status?: string
          subscription_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          conditions: Json
          created_at: string
          description: string
          end_date: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          start_date: string
          updated_at: string
        }
        Insert: {
          conditions: Json
          created_at?: string
          description: string
          end_date: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          start_date: string
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string
          end_date?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      court_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      courts: {
        Row: {
          accessibility_features: string | null
          capacity: number | null
          created_at: string
          description: string | null
          dimensions: string | null
          has_cover: boolean
          has_lighting: boolean
          id: string
          image_url: string | null
          is_active: boolean
          location_info: string | null
          maintenance_info: string | null
          name: string
          surface_type: string | null
          type_id: string
          updated_at: string
        }
        Insert: {
          accessibility_features?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          has_cover?: boolean
          has_lighting?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_info?: string | null
          maintenance_info?: string | null
          name: string
          surface_type?: string | null
          type_id: string
          updated_at?: string
        }
        Update: {
          accessibility_features?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          has_cover?: boolean
          has_lighting?: boolean
          id?: string
          image_url?: string | null
          is_active?: boolean
          location_info?: string | null
          maintenance_info?: string | null
          name?: string
          surface_type?: string | null
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courts_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "court_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attended: boolean | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          payment_status: string
          registration_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          payment_status?: string
          registration_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          payment_status?: string
          registration_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          block_courts: boolean
          created_at: string
          created_by: string | null
          description: string | null
          end_datetime: string
          event_type: string
          id: string
          max_capacity: number | null
          name: string
          notify_clients: boolean
          registration_fee: number | null
          start_datetime: string
          status: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          block_courts?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime: string
          event_type: string
          id?: string
          max_capacity?: number | null
          name: string
          notify_clients?: boolean
          registration_fee?: number | null
          start_datetime: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          block_courts?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string
          event_type?: string
          id?: string
          max_capacity?: number | null
          name?: string
          notify_clients?: boolean
          registration_fee?: number | null
          start_datetime?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      events_courts: {
        Row: {
          court_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          court_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_courts_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_courts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_levels: {
        Row: {
          benefits: string | null
          created_at: string
          frame_color: string | null
          icon: string | null
          id: string
          max_points: number | null
          min_points: number
          name: string
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string
          frame_color?: string | null
          icon?: string | null
          id?: string
          max_points?: number | null
          min_points: number
          name: string
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          created_at?: string
          frame_color?: string | null
          icon?: string | null
          id?: string
          max_points?: number | null
          min_points?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      integrations_mercadopago: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          created_by: string | null
          environment: string
          id: string
          last_test_success: boolean | null
          last_tested_at: string | null
          name: string
          public_key: string | null
          status: string
          test_result_message: string | null
          updated_at: string
          updated_by: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_test_success?: boolean | null
          last_tested_at?: string | null
          name?: string
          public_key?: string | null
          status?: string
          test_result_message?: string | null
          updated_at?: string
          updated_by?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_test_success?: boolean | null
          last_tested_at?: string | null
          name?: string
          public_key?: string | null
          status?: string
          test_result_message?: string | null
          updated_at?: string
          updated_by?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_mercadopago_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_mercadopago_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_mercadopago_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          integration_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          integration_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_mercadopago_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_mercadopago_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_mercadopago"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_stripe: {
        Row: {
          created_at: string
          created_by: string | null
          environment: string
          id: string
          last_test_success: boolean | null
          last_tested_at: string | null
          name: string
          publishable_key: string | null
          secret_key: string | null
          status: string
          test_result_message: string | null
          updated_at: string
          updated_by: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_test_success?: boolean | null
          last_tested_at?: string | null
          name?: string
          publishable_key?: string | null
          secret_key?: string | null
          status?: string
          test_result_message?: string | null
          updated_at?: string
          updated_by?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          last_test_success?: boolean | null
          last_tested_at?: string | null
          name?: string
          publishable_key?: string | null
          secret_key?: string | null
          status?: string
          test_result_message?: string | null
          updated_at?: string
          updated_by?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_stripe_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_stripe_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_stripe_logs: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          integration_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          integration_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          integration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_stripe_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_stripe_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_stripe"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_status_logs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_status: string
          payment_id: string
          previous_status: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status: string
          payment_id: string
          previous_status: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: string
          payment_id?: string
          previous_status?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_status_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_status_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_details_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_status_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_history_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_status_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_modification_reason: string | null
          admin_modified_by: string | null
          amount: number
          booking_id: string | null
          created_at: string
          expiration_date: string | null
          id: string
          mercadopago_payment_id: string | null
          payment_method: string | null
          raw_response: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_modification_reason?: string | null
          admin_modified_by?: string | null
          amount: number
          booking_id?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          raw_response?: Json | null
          status: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_modification_reason?: string | null
          admin_modified_by?: string | null
          amount?: number
          booking_id?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          raw_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_admin_modified_by_fkey"
            columns: ["admin_modified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          points: number
          source_id: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          points: number
          source_id?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          points?: number
          source_id?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          credit_balance: number | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          neighborhood: string | null
          phone: string | null
          preferences: Json | null
          profile_progress: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          credit_balance?: number | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          neighborhood?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_progress?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          credit_balance?: number | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          neighborhood?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_progress?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_types: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          name: string
          points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          name: string
          points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          court_id: string
          created_at: string
          created_by: string | null
          end_datetime: string
          id: string
          reason: string
          start_datetime: string
          updated_at: string
        }
        Insert: {
          court_id: string
          created_at?: string
          created_by?: string | null
          end_datetime: string
          id?: string
          reason: string
          start_datetime: string
          updated_at?: string
        }
        Update: {
          court_id?: string
          created_at?: string
          created_by?: string | null
          end_datetime?: string
          id?: string
          reason?: string
          start_datetime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          advance_booking_days: number | null
          court_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_blocked: boolean
          is_monthly: boolean | null
          max_booking_time: number | null
          min_booking_time: number
          monthly_discount: number | null
          price: number
          price_holiday: number | null
          price_weekend: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          advance_booking_days?: number | null
          court_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_blocked?: boolean
          is_monthly?: boolean | null
          max_booking_time?: number | null
          min_booking_time?: number
          monthly_discount?: number | null
          price: number
          price_holiday?: number | null
          price_weekend?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          advance_booking_days?: number | null
          court_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_blocked?: boolean
          is_monthly?: boolean | null
          max_booking_time?: number | null
          min_booking_time?: number
          monthly_discount?: number | null
          price?: number
          price_holiday?: number | null
          price_weekend?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          cancellation_policy: string | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          google_calendar_integration: boolean | null
          id: string
          logo: string | null
          mercado_pago_key: string | null
          payment_method: Json | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          google_calendar_integration?: boolean | null
          id?: string
          logo?: string | null
          mercado_pago_key?: string | null
          payment_method?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          google_calendar_integration?: boolean | null
          id?: string
          logo?: string | null
          mercado_pago_key?: string | null
          payment_method?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skill_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          rank_order: number
          sport_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          rank_order: number
          sport_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          rank_order?: number
          sport_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_levels_sport_type_id_fkey"
            columns: ["sport_type_id"]
            isOneToOne: false
            referencedRelation: "sport_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          status: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_type_id: string
          created_at: string
          earned_at: string
          id: string
          is_featured: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_type_id: string
          created_at?: string
          earned_at?: string
          id?: string
          is_featured?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_type_id?: string
          created_at?: string
          earned_at?: string
          id?: string
          is_featured?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_type_id_fkey"
            columns: ["achievement_type_id"]
            isOneToOne: false
            referencedRelation: "achievement_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          active_avatar: string | null
          active_frame: string | null
          created_at: string
          current_level_id: string | null
          id: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_avatar?: string | null
          active_frame?: string | null
          created_at?: string
          current_level_id?: string | null
          id?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_avatar?: string | null
          active_frame?: string | null
          created_at?: string
          current_level_id?: string | null
          id?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "gamification_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          city: string | null
          created_at: string
          id: string
          neighborhood: string | null
          onboarding_completed: boolean
          preferred_days: number[] | null
          preferred_game_types: string[] | null
          preferred_times: Json | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          wants_notifications: boolean | null
          zipcode: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          onboarding_completed?: boolean
          preferred_days?: number[] | null
          preferred_game_types?: string[] | null
          preferred_times?: Json | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          wants_notifications?: boolean | null
          zipcode?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          neighborhood?: string | null
          onboarding_completed?: boolean
          preferred_days?: number[] | null
          preferred_game_types?: string[] | null
          preferred_times?: Json | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          wants_notifications?: boolean | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recognitions: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          recognition_type_id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          recognition_type_id: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          recognition_type_id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recognitions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recognitions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recognitions_recognition_type_id_fkey"
            columns: ["recognition_type_id"]
            isOneToOne: false
            referencedRelation: "recognition_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recognitions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sports: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          notes: string | null
          skill_level_id: string
          sport_type_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          skill_level_id: string
          sport_type_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          notes?: string | null
          skill_level_id?: string
          sport_type_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sports_skill_level_id_fkey"
            columns: ["skill_level_id"]
            isOneToOne: false
            referencedRelation: "skill_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sports_sport_type_id_fkey"
            columns: ["sport_type_id"]
            isOneToOne: false
            referencedRelation: "sport_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sports_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_view: {
        Row: {
          email: string | null
          id: string | null
          last_sign_in_at: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Relationships: []
      }
      payment_details_view: {
        Row: {
          admin_modification_reason: string | null
          admin_modified_by: string | null
          amount: number | null
          booking_date: string | null
          booking_id: string | null
          court_name: string | null
          created_at: string | null
          end_time: string | null
          expiration_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          mercadopago_payment_id: string | null
          payment_method: string | null
          raw_response: Json | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_admin_modified_by_fkey"
            columns: ["admin_modified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history_view: {
        Row: {
          admin_modification_reason: string | null
          admin_modified_by: string | null
          amount: number | null
          booking_date: string | null
          booking_id: string | null
          court_name: string | null
          created_at: string | null
          end_time: string | null
          expiration_date: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          mercadopago_payment_id: string | null
          payment_method: string | null
          raw_response: Json | null
          start_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_admin_modified_by_fkey"
            columns: ["admin_modified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      test_mercadopago_integration: {
        Args: { integration_id: string }
        Returns: Json
      }
      test_stripe_integration: {
        Args: { integration_id: string }
        Returns: Json
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
