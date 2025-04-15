
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

// Court types
export type CourtType = 'beach-tennis' | 'padel' | 'tennis' | 'volleyball' | 'other';

// Court interface
export interface Court {
  id: string;
  name: string;
  type: CourtType;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

// Schedule interface
export interface Schedule {
  id: string;
  courtId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isBlocked: boolean;
  price: number;
}

// Booking status
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Payment status
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Booking interface
export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  scheduleId: string;
  date: Date;
  status: BookingStatus;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
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
