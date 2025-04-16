
// Core type definitions for BookaQuadra application

// User role types
export type UserRole = 'user' | 'admin';

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

// Profile type (extends User from Supabase auth)
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  credit_balance: number;
  avatar_url?: string;
  preferences?: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Court types
export type CourtType = {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
};

// Court interface
export interface Court {
  id: string;
  name: string;
  type_id: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  has_cover: boolean;
  has_lighting: boolean;
  surface_type?: string;
  maintenance_info?: string;
  location_info?: string;
  dimensions?: string;
  capacity?: number;
  accessibility_features?: string;
  created_at: Date;
  updated_at: Date;
  // Relação virtual - não está no banco de dados
  court_type?: CourtType;
}

// Schedule interface
export interface Schedule {
  id: string;
  court_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_blocked: boolean;
  price: number;
  price_weekend?: number;
  price_holiday?: number;
  min_booking_time: number;
  max_booking_time?: number;
  advance_booking_days?: number;
  created_at: Date;
  updated_at: Date;
}

// Schedule Block interface
export interface ScheduleBlock {
  id: string;
  court_id: string;
  start_datetime: Date;
  end_datetime: Date;
  reason: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Booking status
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Payment status
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Booking interface
export interface Booking {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: Date;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  amount: number;
  created_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Relações virtuais
  user?: Profile;
  court?: Court;
}

// Transaction type
export type TransactionType = 'payment' | 'refund' | 'credit' | 'debit';

// Transaction status
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// Transaction interface
export interface Transaction {
  id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  payment_method?: string;
  payment_details?: any;
  created_by?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Holiday interface
export interface Holiday {
  id: string;
  name: string;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

// Site configuration settings
export interface SiteSettings {
  companyName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  cancellationPolicy: string;
  mercadoPagoKey?: string;
  googleCalendarIntegration?: boolean;
}
