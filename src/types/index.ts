
import { PaymentMethodConfig } from './payment';

// Tipos de autenticação e usuário
export interface User {
  id: string;
  email: string | null;
  name?: string; // Adicionado para compatibilidade
  avatarUrl?: string; // Adicionado para compatibilidade
  app_metadata?: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
  created_at: string;
  role?: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  neighborhood: string | null;
  credit_balance?: number;
  preferences?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_progress?: number;
}

export type UserRole = 'admin' | 'user' | 'staff';

// Tipos para eventos
export interface Event {
  id: string;
  name: string;
  description?: string;
  banner_url?: string;
  start_datetime: string;
  end_datetime: string;
  registration_fee?: number;
  max_capacity?: number;
  block_courts: boolean;
  notify_clients: boolean;
  status: EventStatus;
  event_type: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  events_courts?: EventCourt[];
}

export type EventStatus = 'active' | 'cancelled' | 'completed' | 'draft' | 'inactive';
export type EventType = 'tournament' | 'class' | 'practice' | 'social' | 'other' | 'day_use' | 'private';

export interface EventCourt {
  id: string;
  event_id: string;
  court_id: string;
  courts?: {
    id: string;
    name: string;
  };
}

// Tipos de quadra
export interface CourtType {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

// Adicionar propriedades faltantes em Court
export interface Court {
  id: string;
  name: string;
  description?: string;
  type_id: string;
  image_url?: string;
  surface_type?: string;
  has_cover: boolean;
  has_lighting: boolean;
  is_active: boolean;
  capacity?: number;
  created_at: string;
  updated_at: string;
  maintenance_info?: string;
  location_info?: string;
  dimensions?: string;
  accessibility_features?: string;
}

// Tipos para onboarding
export type OnboardingStep = 'personal-info' | 'sports-selection' | 'skill-levels' | 'preferences' | 'terms';

export interface SportType {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillLevel {
  id: string;
  sport_type_id: string;
  name: string;
  description?: string | null;
  rank_order: number;
  created_at: string;
  updated_at: string;
}

export interface GameTypePreference {
  id: string;
  name: string;
  description?: string;
  selected: boolean;
}

// Tipo para configurações do site
export interface SiteSettings {
  id?: string;
  companyName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  cancellationPolicy: string;
  mercadoPagoKey: string;
  googleCalendarIntegration: boolean;
  paymentMethod?: PaymentMethodConfig;
  created_at?: string;
  updated_at?: string;
}

// Importar todos os outros tipos de arquivos separados
import {
  Booking,
  BookingRequest,
  BookingResponse
} from './booking';

import {
  AvailableTimeSlot,
  Schedule,
  ScheduleBlock,
  Holiday
} from './court';

import {
  PaymentStatus,
  Payment,
  PaymentStatusLog,
  PaymentStatistics,
  MercadoPagoNotification,
  MercadoPagoPaymentResponse,
  TestConnectionResult
} from './payment';

// Reexportar para compatibilidade - usando export type para resolver o erro TS1205
export type { Booking } from './booking';
export type { BookingRequest } from './booking';
export type { BookingResponse } from './booking';
export type { AvailableTimeSlot } from './court';
export type { Schedule } from './court';
export type { ScheduleBlock } from './court';
export type { Holiday } from './court';
export type { PaymentStatus } from './payment';
export type { Payment } from './payment';
export type { PaymentStatusLog } from './payment';
export type { PaymentStatistics } from './payment';
export type { MercadoPagoNotification } from './payment';
export type { MercadoPagoPaymentResponse } from './payment';
export type { TestConnectionResult } from './payment';

// Export do tipo PaymentMethodConfig
export type { PaymentMethodConfig } from './payment';

// Export do tipo BookingStatus
export type { BookingStatus } from './booking';
