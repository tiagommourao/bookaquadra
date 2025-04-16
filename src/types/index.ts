
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
  city?: string;
  neighborhood?: string;
  profile_progress?: number;
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

// Novas entidades para o fluxo do usuário atleta

// Sport type interface
export interface SportType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: Date;
  updated_at: Date;
}

// Skill level interface
export interface SkillLevel {
  id: string;
  sport_type_id: string;
  name: string;
  description?: string;
  rank_order: number;
  created_at: Date;
  updated_at: Date;
  sport_type?: SportType;
}

// User sport interface (relação entre usuário e modalidade esportiva)
export interface UserSport {
  id: string;
  user_id: string;
  sport_type_id: string;
  skill_level_id: string;
  notes?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Relações virtuais
  sport_type?: SportType;
  skill_level?: SkillLevel;
}

// User preferences interface
export interface UserPreferences {
  id: string;
  user_id: string;
  city?: string;
  neighborhood?: string;
  zipcode?: string;
  wants_notifications: boolean;
  preferred_game_types?: string[];
  preferred_days?: number[];
  preferred_times?: any;
  onboarding_completed: boolean;
  terms_accepted: boolean;
  terms_accepted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Recognition type interface
export interface RecognitionType {
  id: string;
  name: string;
  description: string;
  icon?: string;
  points: number;
  created_at: Date;
  updated_at: Date;
}

// User recognition interface
export interface UserRecognition {
  id: string;
  from_user_id: string;
  to_user_id: string;
  booking_id: string;
  recognition_type_id: string;
  comment?: string;
  created_at: Date;
  updated_at: Date;
  // Relações virtuais
  recognition_type?: RecognitionType;
  from_user?: Profile;
}

// Gamification level interface
export interface GamificationLevel {
  id: string;
  name: string;
  min_points: number;
  max_points?: number;
  icon?: string;
  frame_color?: string;
  benefits?: string;
  created_at: Date;
  updated_at: Date;
}

// User gamification interface
export interface UserGamification {
  id: string;
  user_id: string;
  total_points: number;
  current_level_id?: string;
  active_frame?: string;
  active_avatar?: string;
  created_at: Date;
  updated_at: Date;
  // Relação virtual
  current_level?: GamificationLevel;
}

// Achievement type interface
export interface AchievementType {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  conditions?: any;
  created_at: Date;
  updated_at: Date;
}

// User achievement interface
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type_id: string;
  earned_at: Date;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  // Relação virtual
  achievement_type?: AchievementType;
}

// Point transaction interface
export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  source_type: string;
  source_id?: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// Challenge interface
export interface Challenge {
  id: string;
  name: string;
  description: string;
  start_date: Date;
  end_date: Date;
  points: number;
  conditions: any;
  icon?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// User challenge interface
export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: any;
  is_completed: boolean;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Relação virtual
  challenge?: Challenge;
}

// Onboarding step type
export type OnboardingStep = 
  | 'personal-info'
  | 'sports-selection'
  | 'skill-levels'
  | 'preferences'
  | 'terms';

// Game type preferences
export type GameTypePreference = 'individual' | 'doubles' | 'group';
